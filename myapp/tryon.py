"""Virtual try-on: person photo + garment photo -> photo of the person wearing the garment.

Providers, tried in order:
  1. FASHN API (paid, fast, best quality) — when FASHN_API_KEY is set.
  2. IDM-VTON on Hugging Face (free, no key; HF_TOKEN gives more quota) — public Space via gradio_client.

Around the provider: the person photo is padded (not stretched) to 3:4, the garment is centred on white,
and afterwards the padding is removed and the original face and hair are pasted back with a soft mask,
so the person's face is never altered by the AI.
"""
import base64
import io
import json
import tempfile
import time
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.cache import cache

HF_SPACE = 'yisol/IDM-VTON'
TIMEOUT = 180  # seconds for the whole try-on, all providers together

SIZE = (768, 1024)  # the 3:4 frame both providers work best with

# IDM-VTON is trained on English garment descriptions: "<colour> <garment>".
GARMENTS = {
    'groom_suit': 'classic suit jacket',
    'trousers': 'classic trousers',
    'groom_national': 'embroidered velvet chapan robe',
    'bride_dress': 'wedding dress',
    'bride_national': 'embroidered traditional dress',
}
COLOURS = {'сиёҳ': 'black', 'сафед': 'white', 'кабуд': 'blue', 'сурх': 'red', 'тиллоӣ': 'gold', 'бордо': 'burgundy', 'сабз': 'green'}
FASHN_CATEGORY = {'upper': 'tops', 'lower': 'bottoms', 'full': 'one-pieces'}


def describe(product):
    name = product.name.lower()
    colour = next((en for tg, en in COLOURS.items() if tg in name), '')
    return f'{colour} {GARMENTS.get(product.category, "clothing")}'.strip()


class TryOnError(Exception):
    pass


class TryOnTimeout(TryOnError):
    pass


class TryOnQuota(TryOnError):
    """The free GPU quota is used up (per IP without HF_TOKEN, per account with it)."""


# --- FASHN -----------------------------------------------------------------

def _fashn_call(method, path, body=None):
    request = Request(
        f'{settings.FASHN_API_URL}{path}',
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={'Authorization': f'Bearer {settings.FASHN_API_KEY}', 'Content-Type': 'application/json'},
    )
    try:
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read())
    except HTTPError as error:
        raise TryOnError(f'FASHN {error.code}') from error
    except URLError as error:
        raise TryOnError(f'FASHN unreachable: {error.reason}') from error


def _data_uri(jpeg):
    return 'data:image/jpeg;base64,' + base64.b64encode(jpeg).decode()


def _fashn(person, garment, category, description, deadline):
    started = _fashn_call('POST', '/v1/run', {
        'model_name': 'tryon-v1.6',
        'inputs': {
            'model_image': _data_uri(person),
            'garment_image': _data_uri(garment),
            'category': FASHN_CATEGORY.get(category, 'auto'),
            'seed': 42,
            'mode': 'balanced',
            'output_format': 'jpeg',
            'return_base64': True,
        },
    })
    if started.get('error') or not started.get('id'):
        raise TryOnError(f'FASHN: {started.get("error")}')
    while time.monotonic() < deadline:
        time.sleep(2)
        status = _fashn_call('GET', f'/v1/status/{started["id"]}')
        if status.get('status') == 'completed':
            return base64.b64decode(status['output'][0].split(',', 1)[-1])
        if status.get('status') == 'failed':
            raise TryOnError(f'FASHN failed: {status.get("error")}')
    raise TryOnTimeout('FASHN timeout')


# --- Hugging Face IDM-VTON -------------------------------------------------

def _huggingface(person, garment, category, description, deadline):
    from gradio_client import Client, handle_file

    with tempfile.TemporaryDirectory() as folder:
        person_path, garment_path = Path(folder, 'person.jpg'), Path(folder, 'garment.jpg')
        person_path.write_bytes(person)
        garment_path.write_bytes(garment)
        try:
            # download_files=folder: the result lands in the temp folder and is deleted with it.
            client = Client(HF_SPACE, token=settings.HF_TOKEN or None, verbose=False, download_files=folder, analytics_enabled=False)
            job = client.submit(
                {'background': handle_file(str(person_path)), 'layers': [], 'composite': None},
                handle_file(str(garment_path)),
                description,
                True,  # auto-mask the body
                True,  # auto-crop to the model's 3:4 frame (a no-op: the photo is already padded to 3:4)
                35,  # denoise steps
                42,  # fixed seed: the same photo + garment gives the same result
                api_name='/tryon',
            )
            output, _mask = job.result(timeout=max(5, deadline - time.monotonic()))
        except TimeoutError as error:
            raise TryOnTimeout('Hugging Face timeout') from error
        except Exception as error:  # the Space may be asleep, over quota or erroring
            if 'quota' in str(error).lower():
                raise TryOnQuota(f'Hugging Face: {error}') from error
            raise TryOnError(f'Hugging Face: {error}') from error
        return Path(output).read_bytes()


def huggingface_available():
    """Asks the Hub whether the Space can run (cached for 5 minutes, so the status endpoint stays fast)."""
    state = cache.get('tryon-hf-stage')
    if state is None:
        try:
            with urlopen(f'https://huggingface.co/api/spaces/{HF_SPACE}/runtime', timeout=5) as response:
                state = json.loads(response.read()).get('stage', 'UNKNOWN')
        except (URLError, ValueError, TimeoutError):
            state = 'UNREACHABLE'
        cache.set('tryon-hf-stage', state, 300)
    # SLEEPING Spaces wake up on the first request, so they count as available.
    return state in ('RUNNING', 'SLEEPING', 'RUNNING_BUILDING', 'APP_STARTING')


# --- Image preparation and face restore -----------------------------------

def _jpeg(image):
    buffer = io.BytesIO()
    image.convert('RGB').save(buffer, 'JPEG', quality=92)
    return buffer.getvalue()


def pad_to_portrait(image):
    """Pads (never stretches) to 3:4 with the photo's edge colour and scales to SIZE.
    Returns the padded image and the photo's box inside it, in SIZE coordinates."""
    w, h = image.size
    if w / h > 3 / 4:
        canvas_w, canvas_h = w, round(w * 4 / 3)
    else:
        canvas_w, canvas_h = round(h * 3 / 4), h
    pixels = np.asarray(image)
    edges = np.concatenate([pixels[0], pixels[-1], pixels[:, 0], pixels[:, -1]])
    colour = tuple(int(c) for c in np.median(edges, axis=0))
    canvas = Image.new('RGB', (canvas_w, canvas_h), colour)
    left, top = (canvas_w - w) // 2, (canvas_h - h) // 2
    canvas.paste(image, (left, top))
    k = SIZE[0] / canvas_w
    return canvas.resize(SIZE, Image.LANCZOS), (round(left * k), round(top * k), round((left + w) * k), round((top + h) * k))


def prepare_garment(data):
    """Garment without its background (if rembg is installed), centred on a white 3:4 canvas."""
    image = Image.open(io.BytesIO(data))
    try:
        from rembg import remove

        image = Image.open(io.BytesIO(remove(data)))
    except ImportError:
        pass
    image = image.convert('RGBA')
    image.thumbnail((int(SIZE[0] * 0.9), int(SIZE[1] * 0.9)), Image.LANCZOS)
    canvas = Image.new('RGBA', SIZE, (255, 255, 255, 255))
    canvas.alpha_composite(image, ((SIZE[0] - image.width) // 2, (SIZE[1] - image.height) // 2))
    return canvas.convert('RGB')


FACES = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')


def restore_face(original, result):
    """Pastes the original face, hair and top of the neck over the AI result with a feathered ellipse.
    Both images must have the same size. Without a detected face the result is returned unchanged."""
    gray = cv2.cvtColor(np.asarray(original), cv2.COLOR_RGB2GRAY)
    side = min(gray.shape)
    faces = FACES.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(side // 12, side // 12))
    if len(faces) == 0:
        return result, False
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    # ~35% around the face; a bit more above for hair.
    cx, cy = x + w / 2, y + h / 2 - h * 0.08
    ax, ay = w * 0.5 * 1.35, h * 0.5 * 1.55
    mask = np.zeros(gray.shape, np.float32)
    cv2.ellipse(mask, (int(cx), int(cy)), (int(ax), int(ay)), 0, 0, 360, 1.0, -1)
    feather = max(3, int(w * 0.18)) | 1
    mask = cv2.GaussianBlur(mask, (feather * 2 + 1, feather * 2 + 1), feather / 2)[..., None]
    blended = np.asarray(original, np.float32) * mask + np.asarray(result, np.float32) * (1 - mask)
    return Image.fromarray(blended.clip(0, 255).astype(np.uint8)), True


# --- Public API ------------------------------------------------------------

# name, is it usable now, run, which body parts it can dress (IDM-VTON is an upper-body model).
PROVIDERS = [
    ('fashn', lambda: bool(settings.FASHN_API_KEY), _fashn, {'upper', 'lower', 'full'}),
    ('huggingface', huggingface_available, _huggingface, {'upper'}),
]


def status():
    available = [(name, parts) for name, is_available, _, parts in PROVIDERS if is_available()]
    return {
        'active': available[0][0] if available else None,
        'providers': [name for name, _ in available],
        'supports': sorted(set().union(*(parts for _, parts in available))) if available else [],
    }


def run_tryon(person_image, garment_image, category, description='clothing'):
    """person_image: PIL RGB photo (upright). garment_image: image bytes. category: upper/lower/full.
    Returns (JPEG bytes of the person wearing the garment, provider name, face_restored).

    Raises TryOnTimeout when the time budget runs out, TryOnError when every provider failed.
    """
    padded, box = pad_to_portrait(person_image)
    person = _jpeg(padded)
    garment = _jpeg(prepare_garment(garment_image))

    deadline = time.monotonic() + TIMEOUT
    errors = []
    quota = False
    for name, is_available, run, parts in PROVIDERS:
        if category not in parts or not is_available():
            continue
        if time.monotonic() >= deadline:
            raise TryOnTimeout('; '.join(errors) or 'timeout')
        try:
            raw = run(person, garment, category, description, deadline)
        except TryOnTimeout:
            raise
        except TryOnError as error:
            quota = quota or isinstance(error, TryOnQuota)
            errors.append(str(error))
            continue
        # Undo the padding so the result lines up pixel for pixel with the original photo.
        result = Image.open(io.BytesIO(raw)).convert('RGB').resize(SIZE, Image.LANCZOS).crop(box).resize(person_image.size, Image.LANCZOS)
        final, face_restored = restore_face(person_image, result)
        return _jpeg(final), name, face_restored
    raise (TryOnQuota if quota else TryOnError)('; '.join(errors) or 'no provider available')
