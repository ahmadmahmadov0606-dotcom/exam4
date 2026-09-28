"""Replaces the foreign licence plates on the demo car photos with Tajik-style plates.

Each photo is processed from an untouched backup (<name>.orig.jpg), so the command can be re-run safely.
Plate numbers match the ones shown by the frontend (frontend/src/components/cars/plate.js).
"""
import shutil

import cv2
import numpy as np
from django.conf import settings
from django.core.management.base import BaseCommand
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from myapp.models import Car

LETTERS = 'ABCEHKMOPTX'
REGION = {'Душанбе': '01', 'Хуҷанд': '02', 'Истаравшан': '02', 'Панҷакент': '02', 'Бохтар': '03', 'Кӯлоб': '03', 'Хоруғ': '04', 'Ҳисор': '05'}

# Plate corners (top-left, top-right, bottom-right, bottom-left) in each photo, measured by hand.
QUADS = {
    'demo/020.jpg': [(514, 490), (671, 490), (671, 546), (515, 546)],
    'demo/022.jpg': [(156, 393), (299, 398), (299, 436), (154, 430)],
    'demo/023.jpg': [(108, 422), (246, 439), (244, 480), (105, 462)],
    'demo/024.jpg': [(648, 531), (776, 536), (776, 566), (649, 561)],
    'demo/025.jpg': [(450, 572), (795, 572), (795, 653), (450, 653)],
    'demo/026.jpg': [(910, 504), (1103, 504), (1102, 571), (911, 573)],
    'demo/028.jpg': [(1043, 485), (1107, 480), (1109, 533), (1044, 539)],
    'demo/029.jpg': [(1079, 500), (1196, 487), (1197, 522), (1080, 538)],
    'demo/030.jpg': [(1064, 516), (1136, 514), (1135, 570), (1064, 574)],
    'demo/031.jpg': [(1090, 536), (1228, 501), (1227, 554), (1088, 587)],
    'demo/local/car-mercedes-flowers.jpg': [(349, 790), (644, 787), (642, 880), (351, 873)],
}


def plate_for(car):
    seed = (car.id * 7919 + 1237) % 99991
    digits = str(1000 + seed % 9000)
    letters = LETTERS[seed % len(LETTERS)] + LETTERS[(seed // 11) % len(LETTERS)]
    return digits, letters, REGION.get(car.city.name, '01')


def font(size):
    for name in ('DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'LiberationSans-Bold.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def fitted(draw, text, max_width, size):
    """Largest font (up to `size`) at which `text` fits into `max_width`."""
    while size > 10 and draw.textlength(text, font=font(size)) > max_width:
        size -= 4
    return font(size)


def flag(draw, x, y, w, h):
    draw.rectangle([x, y, x + w, y + h * 2 / 7], fill='#cc0000')
    draw.rectangle([x, y + h * 2 / 7, x + w, y + h * 5 / 7], fill='#ffffff')
    draw.rectangle([x, y + h * 5 / 7, x + w, y + h], fill='#006600')
    r = h * 0.11
    draw.pieslice([x + w / 2 - r, y + h / 2 - r, x + w / 2 + r, y + h / 2 + r], 180, 360, fill='#f8c300')
    draw.rectangle([x, y, x + w, y + h], outline='#999999', width=2)


def draw_plate(car, square=False):
    """Single-row plate (4:1) or, for square holders, the two-row format."""
    digits, letters, region = plate_for(car)
    w, h = (560, 400) if square else (1040, 240)
    img = Image.new('RGB', (w, h), '#fbfbf8')
    d = ImageDraw.Draw(img)
    d.rectangle([6, 6, w - 7, h - 7], outline='#111111', width=12)
    if square:
        flag(d, 40, 40, 110, 76)
        d.text((95, 160), 'TJ', font=font(62), fill='#123f9e', anchor='mm')
        d.text((355, 110), region, font=fitted(d, region, 300, 120), fill='#111111', anchor='mm')
        d.text((w / 2, 290), f'{digits} {letters}', font=fitted(d, f'{digits} {letters}', 480, 130), fill='#111111', anchor='mm')
    else:
        flag(d, 36, 36, 120, 88)
        d.text((96, 180), 'TJ', font=font(64), fill='#123f9e', anchor='mm')
        d.rectangle([190, 28, 194, h - 28], fill='#111111')
        d.text((517, h / 2 + 4), f'{digits} {letters}', font=fitted(d, f'{digits} {letters}', 610, 170), fill='#111111', anchor='mm')
        d.rectangle([842, 28, 846, h - 28], fill='#111111')
        d.text((942, h / 2 + 4), region, font=fitted(d, region, 160, 150), fill='#111111', anchor='mm')
    return img


def paste_plate(photo, plate, quad):
    """Warps the plate into the quad, matches the photo's softness and light, and blends it in."""
    src = np.float32([[0, 0], [plate.width, 0], [plate.width, plate.height], [0, plate.height]])
    dst = np.float32(quad)
    matrix = cv2.getPerspectiveTransform(src, dst)
    size = photo.size
    warped = cv2.warpPerspective(np.asarray(plate), matrix, size, flags=cv2.INTER_AREA)
    mask = cv2.warpPerspective(np.full((plate.height, plate.width), 255, np.uint8), matrix, size, flags=cv2.INTER_LINEAR)

    base = np.asarray(photo).astype(np.float32)
    region = mask > 128
    # Plates in shade look darker: scale by the brightness around the plate (clamped).
    ring = cv2.dilate(mask, np.ones((25, 25), np.uint8)) > 0
    around = base[ring & ~region].mean() if (ring & ~region).any() else 180
    light = float(np.clip(0.65 + around / 400, 0.82, 1.0))
    plate_px = Image.fromarray((warped.astype(np.float32) * light).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    alpha = cv2.GaussianBlur(mask, (3, 3), 0).astype(np.float32)[..., None] / 255
    out = np.asarray(plate_px, np.float32) * alpha + base * (1 - alpha)
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))


class Command(BaseCommand):
    help = 'Рақамҳои хориҷиро дар суратҳои намунавии мошинҳо ба рақамҳои тоҷикӣ иваз мекунад'

    def handle(self, *args, **options):
        done = 0
        for car in Car.objects.exclude(image='').select_related('city'):
            quad = QUADS.get(car.image.name)
            if not quad:
                continue
            path = settings.MEDIA_ROOT / car.image.name
            backup = path.with_name(path.stem + '.orig' + path.suffix)
            if not backup.exists():
                shutil.copyfile(path, backup)
            photo = Image.open(backup).convert('RGB')
            (tl, tr, br, bl) = quad
            width = ((tr[0] - tl[0]) + (br[0] - bl[0])) / 2
            height = ((bl[1] - tl[1]) + (br[1] - tr[1])) / 2
            plate = draw_plate(car, square=width / height < 2.2)
            paste_plate(photo, plate, quad).save(path, quality=90)
            done += 1
            self.stdout.write(f'  ✓ {car.name}: {" ".join(plate_for(car))}')
        self.stdout.write(self.style.SUCCESS(f'Рақамҳои тоҷикӣ гузошта шуданд: {done}'))
