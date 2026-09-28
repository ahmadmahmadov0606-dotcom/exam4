#!/usr/bin/env bash
# Backend ва frontend-ро якҷоя оғоз мекунад. Барои қатъ кардан: Ctrl+C
cd "$(dirname "$0")"
export PATH=~/.local/node/bin:$PATH
.venv/bin/python manage.py runserver &
BACK=$!
trap 'kill $BACK' EXIT
cd frontend && npm run dev
