from django.core.management.base import BaseCommand

from accounts.models import User
from myapp.models import Car, City, Product, Restaurant, Service

CITIES = ['Душанбе', 'Хуҷанд', 'Бохтар', 'Кӯлоб', 'Истаравшан', 'Панҷакент', 'Ҳисор', 'Хоруғ']


class Command(BaseCommand):
    help = 'Шаҳрҳо ва маълумоти намунавӣ илова мекунад'

    def handle(self, *args, **options):
        cities = [City.objects.get_or_create(name=name)[0] for name in CITIES]
        dushanbe = cities[0]

        vendor, created = User.objects.get_or_create(username='vendor', defaults={'role': User.Role.VENDOR})
        if created:
            vendor.set_password('vendor12345')
            vendor.save()

        if not Restaurant.objects.exists():
            base = {'owner': vendor, 'city': dushanbe}
            Restaurant.objects.create(**base, name='Тарабхонаи Наврӯз', address='хиёбони Рӯдакӣ 10', capacity=400, price_per_person=150)
            Restaurant.objects.create(**base, name='Толори Сомон', address='кӯчаи Бохтар 25', capacity=250, price_per_person=120)
            Car.objects.create(**base, name='Мошини домод', brand='Mercedes', model='S-Class', year=2021, color='сафед', price_per_hour=300)
            Car.objects.create(**base, name='Кортеж', brand='Toyota', model='Camry', year=2020, color='сиёҳ', price_per_hour=150)
            Service.objects.create(**base, name='Ҳофизи мардумӣ', category=Service.Category.SINGER, price=3000)
            Service.objects.create(**base, name='Суратгири тӯй', category=Service.Category.PHOTOGRAPHER, price=1500)
            Service.objects.create(**base, name='Тамадаи хушзабон', category=Service.Category.HOST, price=2000)
            Product.objects.create(**base, name='Чапони зардӯзӣ', category=Product.Category.GROOM_NATIONAL, side=Product.Side.GROOM, price=900, stock=5)
            Product.objects.create(**base, name='Либоси арӯсии сафед', category=Product.Category.BRIDE_DRESS, side=Product.Side.BRIDE, price=2500, stock=3)
            Product.objects.create(**base, name='Ҷевони хоб', category=Product.Category.FURNITURE, side=Product.Side.BRIDE, price=4000, stock=2)

        self.stdout.write(self.style.SUCCESS('Маълумот илова шуд. Фурӯшанда: vendor / vendor12345'))
