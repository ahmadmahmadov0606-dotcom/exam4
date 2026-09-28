# Ба интернет баровардани Тӯёна

Дастур барои сервери Ubuntu 22.04/24.04 (VPS). Дар мисолҳо домен `tuyona.tj` аст — ба домени худ иваз кунед.

## 0. Пеш аз оғоз

- [ ] Домен харида шуда ва сабти `A` ба IP-и сервер нигаронида шудааст.
- [ ] Дар сервери нав маълумоти намунавӣ **нест** — танҳо шаҳрҳо худкор илова мешаванд. Эълонҳоро фурӯшандагони воқеӣ илова мекунанд.
- [ ] Суратҳо танҳо аз худи фурӯшандагон ё бо иҷозат. Суратҳои сайтҳои дигар (бо тамғаи «Wedding And You», «Wedding Limo Rentals» ва ғ.) истифода нашаванд.
- [ ] Ҳофизон, тарабхонаҳо ва дигарон худашон ҳисоб месозанд («Барои бизнес») ё шумо бо розигии онҳо ҳисоб месозед.
- [ ] Шартҳои истифода ва сиёсати махфият (рақами телефон ва номи меҳмонон нигоҳ дошта мешавад).

## Роҳи осон: Docker (тавсия мешавад)

Сайт бо се контейнер кор мекунад: **PostgreSQL** (база), **gunicorn** (API) ва **nginx** (сайт, суратҳо ва API дар як суроға).
`runserver` лозим нест. Ҳама чиз пас аз хатогӣ ё бозоғозии сервер худ ба худ аз нав оғоз мешавад.

### 1. Docker-ро насб кунед (як маротиба)

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # баъд аз сервер бароед ва дубора ворид шавед
```

### 2. Лоиҳаро ба сервер гузоред ва оғоз кунед

```bash
cd /srv/tuyona        # папкаи лоиҳа (git clone ё scp)
./start.sh
```

`start.sh` бори аввал файли `.env.prod`-ро бо калиди махфӣ ва пароли базаи тасодуфӣ месозад, баъд ҳама чизро build ва оғоз мекунад.
Сайт дар `http://IP-и-сервер/` кушода мешавад.

### 3. Ҳисоби админ

```bash
docker compose exec backend python manage.py createsuperuser
```

Панели админ: `http://IP-и-сервер/admin/`

### 4. Домен ва HTTPS

1. Дар `.env.prod`: `ALLOWED_HOSTS=tuyona.tj,www.tuyona.tj`.
2. SSL-ро пайваст кунед (масалан Cloudflare ё certbot дар сервер), баъд дар `.env.prod`: `HTTPS=True` ва `CSRF_TRUSTED_ORIGINS=https://tuyona.tj,https://www.tuyona.tj`.
3. `docker compose up -d` — танзимоти нав қабул мешавад.

> `HTTPS=True`-ро танҳо пас аз кор кардани https гузоред — вагарна воридшавӣ ба `/admin/` намешавад.

### 5. Ороишгоҳи AI (ихтиёрӣ)

Дар https://fashn.ai ҳисоб созед, кредит харед ва калиди API-ро гиред. Баъд дар `.env.prod`:

```
FASHN_API_KEY=калиди-шумо
TRYON_DAILY_LIMIT=20
```

`docker compose up -d` — ороишгоҳ фаъол мешавад. Бе калид сайт кор мекунад, танҳо тугмаи «Пӯшондан» хомӯш аст.

### 6. 3D-модели мошинҳо

Ҳар мошин 3D-модели худро аз сурати худаш мегирад (TRELLIS, Hugging Face). Квотаи ройгон дар як рӯз барои 1–2 мошин мерасад; бо `HF_TOKEN` дар `.env.prod` (ҳисоби ройгон дар huggingface.co) бештар. Фармон танҳо мошинҳои бе моделро месозад, пас онро ҳар чанд соат иҷро кунед (`crontab -e`):

```
0 */3 * * * cd /роҳ/ба/лоиҳа && docker compose exec -T backend python manage.py generate_car_models
```

То тайёр шудани модел, тугмаи 3D сурати худи ҳамон мошинро нишон медиҳад. Модели тайёрро дастӣ ҳам дар формаи мошин (`.glb`) бор кардан мумкин аст.

### Фармонҳои рӯзмарра

| Кор | Фармон |
|---|---|
| Ҳолат | `docker compose ps` |
| Логҳо (хатоҳо) | `docker compose logs -f backend` |
| Навсозии код | `git pull && docker compose up -d --build` |
| Қатъ кардан | `docker compose down` (маълумот ва суратҳо боқӣ мемонанд) |
| Нусхаи эҳтиётии база | `docker compose exec db pg_dump -U tuyona tuyona > backup-$(date +%F).sql` |
| Маълумоти намунавӣ (танҳо барои санҷиш) | `docker compose exec backend python manage.py seed_demo` |

---

## Роҳи дастӣ (бе Docker)

### 1. Пакетҳо

```bash
sudo apt update
sudo apt install -y python3-venv python3-dev postgresql nginx certbot python3-certbot-nginx git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
```

### 2. База (PostgreSQL)

```bash
sudo -u postgres psql -c "CREATE USER tuyona WITH PASSWORD 'пароли-мустаҳкам';"
sudo -u postgres psql -c "CREATE DATABASE tuyona OWNER tuyona;"
```

### 3. Код ва `.env`

```bash
sudo mkdir -p /srv/tuyona && sudo chown $USER /srv/tuyona
cd /srv/tuyona   # лоиҳаро ин ҷо гузоред (git clone ё scp)
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

`/srv/tuyona/.env`:

```
SECRET_KEY=<натиҷаи: python3 -c "import secrets; print(secrets.token_urlsafe(50))">
DEBUG=False
ALLOWED_HOSTS=tuyona.tj,www.tuyona.tj
CORS_ALLOWED_ORIGINS=https://tuyona.tj,https://www.tuyona.tj
CSRF_TRUSTED_ORIGINS=https://tuyona.tj,https://www.tuyona.tj
HTTPS=True
DB_NAME=tuyona
DB_USER=tuyona
DB_PASSWORD=пароли-мустаҳкам
DB_HOST=localhost
```

> Агар `SECRET_KEY` иваз нашавад ва `DEBUG=False` бошад, Django оғоз намешавад — ин қасдан аст.

### 4. Backend

```bash
.venv/bin/python manage.py migrate
.venv/bin/python manage.py collectstatic --noinput
.venv/bin/python manage.py init_cities     # танҳо шаҳрҳо, бе маълумоти намунавӣ
.venv/bin/python manage.py createsuperuser # ҳисоби админ (/admin/)
```

`/etc/systemd/system/tuyona.service`:

```ini
[Unit]
Description=Tuyona API
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/srv/tuyona
ExecStart=/srv/tuyona/.venv/bin/gunicorn core.wsgi:application --bind 127.0.0.1:8000 --workers 3
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo mkdir -p /srv/tuyona/media && sudo chown -R www-data:www-data /srv/tuyona/media
sudo systemctl enable --now tuyona
```

### 5. Тоза кардани маълумоти намунавӣ

```bash
.venv/bin/python manage.py clear_demo        # аввал нишон медиҳад, ки чӣ нест мешавад
.venv/bin/python manage.py clear_demo --yes  # нест мекунад; шаҳрҳо мемонанд
```

### 6. Frontend

```bash
cd /srv/tuyona/frontend
echo "VITE_API_URL=https://tuyona.tj/api" > .env
npm ci && npm run build        # натиҷа: frontend/dist
```

### 7. Nginx ва HTTPS

`/etc/nginx/sites-available/tuyona`:

```nginx
server {
    server_name tuyona.tj www.tuyona.tj;
    client_max_body_size 20M;               # суратҳо ва видео (то 15 МБ)

    root /srv/tuyona/frontend/dist;
    index index.html;

    location /api/    { proxy_pass http://127.0.0.1:8000; include proxy_params; }
    location /admin/  { proxy_pass http://127.0.0.1:8000; include proxy_params; }
    location /static/ { alias /srv/tuyona/staticfiles/; }
    location /media/  { alias /srv/tuyona/media/; }

    location / { try_files $uri /index.html; }   # React Router
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tuyona /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d tuyona.tj -d www.tuyona.tj
```

Swagger (`/swagger/`) дар ин танзимот кушода нест — агар лозим бошад, `location /swagger/` илова кунед.

### 8. Пас аз оғоз

- [ ] Бақайдгирӣ, воридшавӣ, брон ва боргузории суратро дар сайти воқеӣ санҷед.
- [ ] Нусхаи эҳтиётӣ ҳар рӯз: `pg_dump tuyona > backup-$(date +%F).sql` ва папкаи `media/`.
- [ ] Навсозӣ: `git pull`, `pip install -r requirements.txt`, `migrate`, `collectstatic`, `npm run build`, `sudo systemctl restart tuyona`.
