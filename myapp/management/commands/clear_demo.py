import shutil
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from myapp.models import Car, Product, Restaurant, Review, Service

# Accounts created by `seed`, `seed_demo` and manual API testing. Deleting a user cascades to
# their listings, bookings, orders, reviews, weddings and notifications.
DEMO_USERS = ['vendor', 'vendor1', 'vendor2', 'client1'] + [f'mehmon{i}' for i in range(1, 7)]


class Command(BaseCommand):
    help = 'Маълумоти намунавиро (корбарон, эълонҳо, шарҳҳо, суратҳо) пеш аз оғози сайт нест мекунад'

    def add_arguments(self, parser):
        parser.add_argument('--yes', action='store_true', help='Воқеан нест кардан (бе он танҳо нишон медиҳад)')

    def handle(self, *args, **options):
        users = User.objects.filter(username__in=DEMO_USERS)
        counts = {
            'корбар': users.count(),
            'тарабхона': Restaurant.objects.filter(owner__in=users).count(),
            'мошин': Car.objects.filter(owner__in=users).count(),
            'хизмат': Service.objects.filter(owner__in=users).count(),
            'мол': Product.objects.filter(owner__in=users).count(),
            'шарҳ': Review.objects.filter(user__in=users).count(),
        }
        demo_media = settings.MEDIA_ROOT / 'demo'
        avatars = [u.avatar.path for u in users if u.avatar]

        self.stdout.write('Нест карда мешавад:')
        for label, count in counts.items():
            self.stdout.write(f'  {label}: {count}')
        self.stdout.write(f'  корбарон: {", ".join(users.values_list("username", flat=True)) or "—"}')
        self.stdout.write(f'  папкаи суратҳо: {demo_media if demo_media.exists() else "—"}')

        if not options['yes']:
            self.stdout.write(self.style.WARNING('Ҳеҷ чиз нест нашуд. Барои нест кардан: python manage.py clear_demo --yes'))
            return

        with transaction.atomic():
            users.delete()
        shutil.rmtree(demo_media, ignore_errors=True)
        for path in avatars:
            Path(path).unlink(missing_ok=True)
        self.stdout.write(self.style.SUCCESS('Маълумоти намунавӣ нест карда шуд. Шаҳрҳо боқӣ монданд.'))
