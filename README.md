# Wedding API — платформаи тӯй

Backend барои ташкили тӯй дар Django REST Framework. Корбар метавонад тарабхона, мошин барои домод, ҳофиз, суратгир ва тамадаро брон кунад, либоси домоду арӯс ва мебел (сеп) фармоиш диҳад ва нақшаи тӯйи худро (меҳмонон, вазифаҳо, харҷҳо) пеш барад.

## Технологияҳо
Django, DRF, SimpleJWT, drf-yasg (Swagger), django-filter, django-cors-headers, SQLite.

## Сохтор
```
core/      танзимот ва url-ҳои асосӣ
accounts/  корбарон: бақайдгирӣ, login, JWT, профил
myapp/     тарабхона, мошин, хизматҳо, мол, брон, шарҳ, тӯй, огоҳинома
```

## Оғоз
```bash
python -m venv .venv
.venv\Scripts\activate          # Windows  (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env          # Linux/Mac: cp .env.example .env
python manage.py makemigrations accounts myapp
python manage.py migrate
python manage.py seed           # шаҳрҳо ва маълумоти намунавӣ
python manage.py createsuperuser
python manage.py runserver
```
Swagger: http://127.0.0.1:8000/swagger/ · ReDoc: http://127.0.0.1:8000/redoc/ · Admin: http://127.0.0.1:8000/admin/

## Нақшҳо
- `client` — брон мекунад, фармоиш медиҳад, шарҳ менависад, тӯйи худро идора мекунад.
- `vendor` — эълон (тарабхона, мошин, хизмат, мол) илова мекунад ва бронҳои объектҳои худро тасдиқ ё рад мекунад.

## Endpoint-ҳо
| Роҳ | Тавсиф |
|---|---|
| `POST /api/auth/register/` | бақайдгирӣ (токенҳоро бармегардонад) |
| `POST /api/auth/login/` | гирифтани `access` ва `refresh` |
| `POST /api/auth/refresh/` | нав кардани токен |
| `POST /api/auth/logout/` | баромадан (refresh ба blacklist) |
| `GET/PATCH /api/auth/me/` | профил |
| `POST /api/auth/change-password/` | ивази парол |
| `/api/cities/` | шаҳрҳо |
| `/api/restaurants/` | тарабхонаҳо; `GET /restaurants/{id}/busy_dates/` |
| `/api/cars/` | мошинҳо |
| `/api/services/` | ҳофиз, созанда, тамада, суратгир, видеограф, ороишгар, торт |
| `/api/products/` | либоси домод ва арӯс, мебел, кӯрпа, заргарӣ |
| `/api/restaurant-bookings/`, `/api/car-bookings/`, `/api/service-bookings/` | бронҳо |
| `/api/orders/` | фармоиши мол |
| `POST .../{id}/cancel/` | бекор кардани брон (мизоҷ) |
| `POST .../{id}/set_status/` | `confirmed` / `rejected` / `completed` (фурӯшанда) |
| `/api/reviews/` | шарҳ ва рейтинг (1–5) |
| `/api/weddings/`, `/api/wedding-guests/`, `/api/wedding-tasks/`, `/api/wedding-expenses/` | нақшаи тӯй |
| `/api/notifications/`, `POST /api/notifications/read_all/` | огоҳиномаҳо |

Ҳамаи эълонҳо `/mine/` доранд (эълонҳои худи фурӯшанда). Филтрҳо: `?city=1&price__lte=500&search=...&ordering=-rating`.

## JWT дар Swagger
Login кунед, `access`-ро нусха гиред, **Authorize** -ро пахш кунед ва нависед: `Bearer <access>`.

## Санҷишҳо (validation)
Брони дукарата (тарабхона — як сана, мошин ва хизмат — бархӯрди вақт), санаи гузашта, `end_time` пеш аз `start_time`, зиёд будани меҳмонон аз ғунҷоиш, набудани мол дар анбор, нархи манфӣ, рейтинг берун аз 1–5. `owner`, `user` ва `total_price` ҳамеша дар backend муайян мешаванд.
