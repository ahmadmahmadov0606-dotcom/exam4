#!/bin/sh
# Runs on every container start: bring the database and static files up to date, then start gunicorn.
set -e
python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py init_cities
exec "$@"
