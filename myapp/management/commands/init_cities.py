from django.core.management.base import BaseCommand

from myapp.models import City

CITIES = ['Душанбе', 'Хуҷанд', 'Бохтар', 'Кӯлоб', 'Истаравшан', 'Панҷакент', 'Ҳисор', 'Хоруғ']


class Command(BaseCommand):
    help = 'Шаҳрҳоро илова мекунад (бе маълумоти намунавӣ); такроран иҷро кардан бехатар аст'

    def handle(self, *args, **options):
        created = sum(City.objects.get_or_create(name=name)[1] for name in CITIES)
        self.stdout.write(self.style.SUCCESS(f'Шаҳрҳо тайёр ({created} нав).'))
