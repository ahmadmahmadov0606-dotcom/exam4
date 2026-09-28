# Тӯёна — Frontend

React-интерфейс барои платформаи тӯй. Бо Django REST API-и ҳамин лоиҳа кор мекунад.

## Технологияҳо
React 19 + Vite, Tailwind CSS v4, React Router, Axios, TanStack Query, react-hot-toast.

## Оғоз

Node.js 20+ лозим аст.

```bash
# 1. Backend (дар папкаи боло)
cd ..
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py makemigrations accounts myapp
python manage.py migrate
python manage.py seed          # фурӯшанда: vendor / vendor12345
python manage.py seed_demo     # 58 эълон + суратҳо аз Wikimedia Commons (интернет лозим)
python manage.py runserver

# 2. Frontend (терминали дигар)
cd frontend
cp .env.example .env           # VITE_API_URL=http://127.0.0.1:8000/api
npm install
npm run dev                    # http://localhost:5173
```

Барои production: `npm run build` → папкаи `dist/`.

> CORS: бэкенд `http://localhost:5173`-ро аллакай иҷозат медиҳад (`CORS_ALLOWED_ORIGINS` дар `.env`-и бэкенд).

## Сохтор
```
src/
  api/          axios (client.js) ва як файл барои ҳар ресурс
  context/      AuthContext — user, login, logout, register
  components/   Navbar, ListingCard, Filters, Pagination, StatusBadge, StarRating,
                Calendar, Modal, ImageUpload, EmptyState, Loader ...
    wedding/    қисмҳои нақшаи тӯй (меҳмонон, вазифаҳо, харҷҳо, буҷа)
    vendor/     формаи эълон
  hooks/        useForm, useCities
  pages/        як файл барои ҳар саҳифа
  utils/        formatPrice, formatDate, parseApiErrors, константаҳо
```

## Саҳифаҳо
| Роҳ | Тавсиф |
|---|---|
| `/` | ҷустуҷӯ (шаҳр, сана, меҳмонон), категорияҳо, беҳтаринҳо |
| `/restaurants`, `/cars`, `/services`, `/products` | рӯйхат бо филтрҳо (дар URL) ва саҳифабандӣ |
| `/restaurants/:id` | сурат, тақвими санаҳои банд, брон, шарҳҳо |
| `/cars/:id`, `/services/:id` | брон бо сана ва вақт |
| `/products/:id` | фармоиш бо миқдор ва суроға |
| `/my-bookings` | бронҳо ва фармоишҳои ман, бекор кардан |
| `/wedding`, `/wedding/:id` | нақшаи тӯй: ҳисоби вақт, буҷа, меҳмонон, вазифаҳо, харҷҳо |
| `/vendor` | танҳо фурӯшанда: эълонҳо, тасдиқ/рад кардани бронҳо |
| `/login`, `/register`, `/profile` | ҳисоб |

## Қайдҳо
- JWT дар `localStorage` нигоҳ дошта мешавад. Ҳангоми 401 як маротиба `/auth/refresh/` даъват мешавад (токенҳо иваз мешаванд, ҳардуяш нигоҳ дошта мешавад); агар нашуд — logout.
- Хатогиҳои `{field: [...]}` зери майдонҳо, `{detail}` ҳамчун toast нишон дода мешаванд.
- API бронҳо ҳам бронҳои худи корбар ва ҳам бронҳои эълонҳои ӯро бармегардонад; «Бронҳои ман» ва «Дархостҳои воридшуда» онҳоро аз рӯи `user` ҷудо мекунанд.
