"""Wedding assistant: answers questions about planning a Tajik wedding and recommends listings from this site.

Provider: Claude (ANTHROPIC_API_KEY) if set, otherwise an open model through Hugging Face (HF_TOKEN).
"""
import httpx
from django.conf import settings

from .models import Car, Product, Restaurant, Service

ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
HF_URL = 'https://router.huggingface.co/v1/chat/completions'
MAX_TURNS = 12  # earlier messages are dropped to keep requests small

SYSTEM = """Ту «Тӯёна» — ёрдамчии тӯйи сайти тӯйи тоҷикӣ ҳастӣ. Ба домод, арӯс ва оилаҳояшон дар ташкили тӯй кӯмак мекунӣ:
буҷа, нақша ва мӯҳлатҳо, рӯйхати меҳмонон, анъанаҳои тӯйи тоҷикӣ (хостгорӣ, фотиҳа, никоҳ, сарупо, ош, базм),
интихоби тарабхона, мошин, ҳофиз, суратгир ва либос.

Қоидаҳо:
- Бо ҳамон забоне ҷавоб деҳ, ки корбар навиштааст (тоҷикӣ, русӣ ё англисӣ). Тоҷикиро бо алифбои кириллӣ навис.
- Кӯтоҳ ва амалӣ навис; рӯйхатҳои кӯтоҳ хуб аст.
- Вақте хизмат ё мол тавсия медиҳӣ, аввал аз ФЕҲРИСТИ САЙТ дар поён интихоб кун, бо ном, шаҳр ва нарх.
  Чизеро, ки дар феҳрист нест, ҳамчун хизмати сайт муаррифӣ накун ва нарх наофар.
- Нархҳо бо сомонӣ (сом.) ҳастанд.
- Агар савол ба тӯй рабт надошта бошад, хушмуомила ба мавзӯи тӯй баргард."""


class AssistantError(Exception):
    pass


class AssistantUnavailable(AssistantError):
    pass


def provider():
    if settings.ANTHROPIC_API_KEY:
        return 'claude'
    if settings.HF_TOKEN:
        return 'huggingface'
    return None


def catalogue():
    """A compact list of what the site offers, so answers point to real listings."""
    lines = []
    for r in Restaurant.objects.select_related('city')[:20]:
        lines.append(f'- Тарабхона «{r.name}», {r.city}: то {r.capacity} нафар, {r.price_per_person:.0f} сом./нафар')
    for c in Car.objects.select_related('city')[:15]:
        lines.append(f'- Мошин {c.brand} {c.model} ({c.year}, {c.color}), {c.city}: {c.price_per_hour:.0f} сом./соат')
    for s in Service.objects.select_related('city')[:30]:
        lines.append(f'- {s.get_category_display()} «{s.name}», {s.city}: {s.price:.0f} сом.')
    for p in Product.objects.select_related('city')[:30]:
        lines.append(f'- {p.get_category_display()} «{p.name}»: {p.price:.0f} сом.')
    return '\n'.join(lines) or '(ҳоло холӣ)'


def ask(messages):
    """messages: [{'role': 'user'|'assistant', 'content': str}, …] ending with the user's question."""
    messages = messages[-MAX_TURNS:]
    system = f'{SYSTEM}\n\nФЕҲРИСТИ САЙТ:\n{catalogue()}'
    which = provider()
    if which is None:
        raise AssistantUnavailable('No ANTHROPIC_API_KEY or HF_TOKEN')
    try:
        if which == 'claude':
            response = httpx.post(
                ANTHROPIC_URL,
                headers={'x-api-key': settings.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01'},
                json={'model': settings.ASSISTANT_MODEL, 'max_tokens': 1024, 'system': system, 'messages': messages},
                timeout=60,
            )
            response.raise_for_status()
            return ''.join(block.get('text', '') for block in response.json()['content']).strip()
        response = httpx.post(
            HF_URL,
            headers={'Authorization': f'Bearer {settings.HF_TOKEN}'},
            json={
                'model': settings.ASSISTANT_HF_MODEL,
                'max_tokens': 1024,
                'temperature': 0.5,
                'messages': [{'role': 'system', 'content': system}, *messages],
            },
            timeout=60,
        )
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content'].strip()
    except httpx.HTTPStatusError as error:
        raise AssistantError(f'{error.response.status_code}: {error.response.text[:300]}') from error
    except (httpx.HTTPError, KeyError, IndexError, ValueError) as error:
        raise AssistantError(str(error)) from error
