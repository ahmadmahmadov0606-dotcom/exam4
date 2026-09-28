#!/usr/bin/env bash
# Starts Tuyona in production with Docker: database, API (gunicorn) and website (nginx).
# Everything restarts by itself after a crash or a server reboot.
set -e
cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker насб нест. Насб кунед:  curl -fsSL https://get.docker.com | sudo sh"
  exit 1
fi

if [ ! -f .env.prod ]; then
  secret=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
  dbpass=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")
  cat > .env.prod <<ENV
SECRET_KEY=$secret
DEBUG=False
# Домен ё IP-и сервер, бо вергул (масалан: tuyona.tj,www.tuyona.tj,203.0.113.5)
ALLOWED_HOSTS=*
# Пас аз пайваст кардани SSL (https) ба True иваз кунед
HTTPS=False
CSRF_TRUSTED_ORIGINS=
# Ороишгоҳи AI: бе калид модели ройгони Hugging Face кор мекунад
# FASHN (пулакӣ, тез): https://fashn.ai
FASHN_API_KEY=
# Hugging Face (ройгон, квотаи бештар): https://huggingface.co/settings/tokens
HF_TOKEN=
TRYON_DAILY_LIMIT=20
DB_NAME=tuyona
DB_USER=tuyona
DB_PASSWORD=$dbpass
POSTGRES_DB=tuyona
POSTGRES_USER=tuyona
POSTGRES_PASSWORD=$dbpass
ENV
  echo "Файли .env.prod сохта шуд (калид ва пароли база худкор)."
fi

docker compose up -d --build
echo
echo "Тайёр! Сайт кор мекунад:  http://$(hostname -I 2>/dev/null | awk '{print $1}')/"
echo "Ҳисоби админ:            docker compose exec backend python manage.py createsuperuser"
echo "Логҳо:                   docker compose logs -f"
