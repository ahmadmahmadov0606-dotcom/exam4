import json
import random
import shutil
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand

from accounts.models import User
from myapp.models import Car, City, Product, Restaurant, Review, Service

CITIES = ['Душанбе', 'Хуҷанд', 'Бохтар', 'Кӯлоб', 'Истаравшан', 'Панҷакент', 'Ҳисор', 'Хоруғ']

# Photos are hand-picked from Wikimedia Commons (see media/demo/CREDITS.txt);
# `local:` ones are the project's own files in demo_images/.
LOCAL_IMAGES = Path(__file__).parent / 'demo_images'
RESTAURANTS = [
    ('Тарабхонаи Наврӯз', 'Душанбе', 'хиёбони Рӯдакӣ 10', 400, 150, 'Elegant banquet setup for wedding reception with beautifully arranged tables in soft lighting.jpg'),
    ('Толори Сомон', 'Душанбе', 'кӯчаи Бохтар 25', 250, 120, 'Banquet Hall Thorbjørnrud Hotell.jpg'),
    ('Кохи Арғувон', 'Душанбе', 'кӯчаи Айнӣ 48', 600, 180, 'Glasgow City Chambers - Banqueting Hall - 3.jpg'),
    ('Тарабхонаи Шоҳона', 'Душанбе', 'хиёбони Исмоили Сомонӣ 5', 800, 220, 'local:hall-modern.jpg'),
    ('Толори Гулистон', 'Хуҷанд', 'кӯчаи Ленин 102', 500, 130, 'HK Central City Hall lower block Chinese restaurant interior Oct-2012.jpg'),
    ('Тарабхонаи Сириус', 'Хуҷанд', 'хиёбони Сирдарё 3', 350, 110, 'local:hall-purple.jpg'),
    ('Толори Хатлон', 'Бохтар', 'кӯчаи Вахш 17', 450, 100, 'local:hall-aisle.jpg'),
    ('Тарабхонаи Меҳргон', 'Кӯлоб', 'кӯчаи Сомониён 8', 300, 95, 'Decorative illuminated love sign at a wedding reception venue during evening celebration.jpg'),
    ('Толори Истаравшан', 'Истаравшан', 'кӯчаи Шарқ 21', 280, 90, "(Venice) Ca' Rezzonico ballroom chandelier.jpg"),
    ('Тарабхонаи Саразм', 'Панҷакент', 'кӯчаи Рӯдакӣ 40', 320, 95, 'Leangkollen Hotel in Asker, Norway. A conference hotel designed by architect Wilhelm K. Essendrop 1941 as a log cabin residence for Quisling. Photo 2019-03-31. Restaurant hall with wrought iron chandeliers, paintings, fire place, etc C.jpg'),
    ('Боғи Ҳисор', 'Ҳисор', 'роҳи Қалъа 2', 700, 140, 'local:hall-tent.jpg'),
    ('Кохи Рӯдакӣ', 'Панҷакент', 'хиёбони Рӯдакӣ 12', 450, 110, 'Banquet hall, Royal Castle, Laeken, 2026.jpg'),
    ('Толори Зарафшон', 'Панҷакент', 'кӯчаи Саразм 7', 380, 100, 'Banquet hall, Royal Castle, Laeken, 2026.jpg'),
    ('Боғи Мағиён', 'Панҷакент', 'роҳи Мағиён 3', 600, 120, 'Banquet hall Vystavka at VDNKh in Moscow.jpg'),
    ('Тарабхонаи Помир', 'Хоруғ', 'кӯчаи Ленин 5', 200, 105, 'local:hall-mountain.jpg'),
]

CARS = [
    ('Мошини домод', 'Душанбе', 'Mercedes-Benz', 'S-Class', 2021, 'сафед', 5, 300, 'MERCEDES-BENZ S-CLASS (V222) China (2).jpg'),
    ('Кортеж', 'Душанбе', 'Toyota', 'Camry', 2020, 'сиёҳ', 5, 150, 'local:car-camry-flowers.jpg'),
    ('Мошини домод Mercedes', 'Душанбе', 'Mercedes-Benz', 'S-Class', 2022, 'сиёҳ', 5, 350, 'Mercedes-Benz W223 IAA 2021 1X7A0206.jpg'),
    ('Кортежи Camry', 'Душанбе', 'Toyota', 'Camry', 2021, 'сафед', 5, 150, 'Toyota Camry (XV70) IMG 9081.jpg'),
    ('Lexus LX барои тӯй', 'Душанбе', 'Lexus', 'LX 600', 2023, 'нуқрагин', 7, 400, 'Lexus LX 600 VJA310 Atomic Silver (2).jpg'),
    ('BMW 7 Series', 'Хуҷанд', 'BMW', '7 Series', 2021, 'нуқрагин', 5, 300, 'BMW 7 SERIES LWB (G11) China (2).jpg'),
    ('Rolls-Royce Ghost', 'Душанбе', 'Rolls-Royce', 'Ghost', 2021, 'кабуд', 5, 900, 'Rolls-Royce Ghost HCC21.jpg'),
    ('Chevrolet Tahoe', 'Хуҷанд', 'Chevrolet', 'Tahoe', 2020, 'сафед', 7, 250, '15-20 Chevrolet Tahoe LT.jpg'),
    ('Land Cruiser 300', 'Бохтар', 'Toyota', 'Land Cruiser 300', 2022, 'сафед', 7, 280, '2021 Toyota Land Cruieser 300 ZX.jpg'),
    ('Mercedes G-Class', 'Кӯлоб', 'Mercedes-Benz', 'G 63', 2021, 'сиёҳ', 5, 450, 'Mercedes-AMG G 63 (2018) IMG 4370.jpg'),
    ('Hyundai Sonata', 'Истаравшан', 'Hyundai', 'Sonata', 2020, 'сафед', 5, 100, '2020 Hyundai Sonata SEL (Quartz White), front right.jpg'),
    ('Kia K5', 'Панҷакент', 'Kia', 'K5', 2021, 'сиёҳ', 5, 110, '0 Kia K5 (DL3) 1.jpg'),
    ('Mercedes E-Class бо гулҳо', 'Душанбе', 'Mercedes-Benz', 'E-Class Coupé', 2013, 'сафед', 4, 250, 'local:car-mercedes-flowers.jpg'),
    ('Volkswagen Scirocco бо ороиш', 'Хуҷанд', 'Volkswagen', 'Scirocco', 2014, 'кабуд', 4, 150, 'local:car-vw-flowers.jpg'),
    ('Лимузини сафед', 'Душанбе', 'Лимузин', 'Stretch', 2015, 'сафед', 10, 600, 'local:car-limo.jpg'),
]

S = Service.Category
SERVICES = [
    ('Ҳофизи мардумӣ', 'Душанбе', S.SINGER, 3000, 10, 'Daytona Lights.jpg'),
    ('Ҳофиз Фирӯз', 'Душанбе', S.SINGER, 3000, 12, 'DFC 5455 Live band lights up the night at Mahakanon Pattaya - energetic crowd electric guitars and a stage full of sound.jpg'),
    ('Ҳофизаи Нигина', 'Хуҷанд', S.SINGER, 2500, 8, 'DSCF1118 Three musicians perform on a brightly lit stage under a tent - one playing guitar one singing into a microphone and another on percussion - surrounded by stage lights and equipment.jpg'),
    ('Гурӯҳи созандагони «Шашмақом»', 'Душанбе', S.MUSICIANS, 4000, 15, 'Doira chalayotgan yigit.png'),
    ('Дойранавозони Кӯлоб', 'Кӯлоб', S.MUSICIANS, 1800, 10, 'Doira chalayotgan yigit.png'),
    ('Рубобнавозони Кӯлоб', 'Кӯлоб', S.MUSICIANS, 1800, 10, 'Rabab ca. 1885 Indian (north), Metropolitan Museum of Art.jpg'),
    ('Тамадаи хушзабон', 'Душанбе', S.HOST, 2000, 6, 'Gooseneck microphone on podium with stage bokeh lights 01.jpg'),
    ('Тамада Шоҳрух', 'Душанбе', S.HOST, 2000, 7, 'Gooseneck microphone on podium with stage bokeh lights 01.jpg'),
    ('Тамада Мадина', 'Хуҷанд', S.HOST, 1800, 5, 'Daytona Lights.jpg'),
    ('Суратгири тӯй', 'Душанбе', S.PHOTOGRAPHER, 1500, 6, 'Wedding photographer at work.jpg'),
    ('Студияи суратгирии «Лаҳза»', 'Душанбе', S.PHOTOGRAPHER, 1500, 9, 'Photographic lenses and tubes 2025.jpg'),
    ('Суратгир Далер', 'Бохтар', S.PHOTOGRAPHER, 1000, 4, 'Wedding photographer at work.jpg'),
    ('Видеостудияи «Кадр»', 'Душанбе', S.VIDEOGRAPHER, 2500, 6, 'Multi-camera video production setup.jpg'),
    ('Видеограф Акмал', 'Хуҷанд', S.VIDEOGRAPHER, 1700, 5, 'NEWS Videographer at Bairavakona Water Falls.jpg'),
    ('Салони «Малика»', 'Душанбе', S.MAKEUP, 1200, 11, 'Makeup Brushes - Πινέλα μακιγιάζ.JPG'),
    ('Ороишгар Зарина', 'Кӯлоб', S.MAKEUP, 800, 6, 'Makeupil.png'),
    ('Ороиши толор «Гулдаста»', 'Душанбе', S.DECOR, 3500, 8, 'Decorative flowers and fruits on the wedding table with blurry background.jpg'),
    ('Декор «Зеболанд»', 'Хуҷанд', S.DECOR, 2800, 5, 'Legant table setting with white floral centerpiece.jpg'),
    ('Қаннодии «Ширин»', 'Душанбе', S.CAKE, 900, 10, 'Pink decorated wedding cake tiered.jpg'),
    ('Торти хонагӣ аз Нодира', 'Истаравшан', S.CAKE, 600, 7, 'Wedding Cake - White and Blue.jpg'),
]

P, SD = Product.Category, Product.Side
PRODUCTS = [
    ('Чапони зардӯзӣ', 'Душанбе', P.GROOM_NATIONAL, SD.GROOM, 900, 5, 'Manteau brodé de cérémonie (Boukhara, Ouzbékistan) (5676363385).jpg'),
    ('Тоқии чакан', 'Истаравшан', P.GROOM_NATIONAL, SD.GROOM, 150, 20, 'Tajik Tubeteika-1.jpg'),
    ('Костюми классикии сиёҳ', 'Душанбе', P.GROOM_SUIT, SD.GROOM, 1800, 8, 'EsmoquinSombra.jpg'),
    ('Костюми тӯйи кабуд', 'Хуҷанд', P.GROOM_SUIT, SD.GROOM, 1500, 6, 'Tuxedo details.jpg'),
    ('Либоси арӯсии сафед', 'Душанбе', P.BRIDE_DRESS, SD.BRIDE, 2500, 3, 'Mannequin wearing a wedding dress (1561524).jpg'),
    ('Либоси арӯсии «Малика»', 'Хуҷанд', P.BRIDE_DRESS, SD.BRIDE, 3200, 2, 'Wedding gown with a bow.jpg'),
    ('Либоси чакан', 'Кӯлоб', P.BRIDE_NATIONAL, SD.BRIDE, 1100, 4, '19th century Suzani rug.jpg'),
    ('Либоси атлас', 'Хуҷанд', P.BRIDE_NATIONAL, SD.BRIDE, 700, 10, 'Adras (Ikat). 1990s. Silk, cotton.jpg'),
    ('Ҷевони хоб', 'Душанбе', P.FURNITURE, SD.BRIDE, 4000, 2, 'Empty wooden wardrobe closeup.jpg'),
    ('Маҷмӯи мебели хоб', 'Бохтар', P.FURNITURE, SD.BRIDE, 9500, 2, 'Interieur slaapkamer - Bedroom Interior (5259996927).jpg'),
    ('Кӯрпачаҳои атласӣ (6 дона)', 'Кӯлоб', P.BEDDING, SD.BRIDE, 1200, 5, 'Tajik dastarkhon.jpg'),
    ('Кӯрпаи пахтагӣ', 'Ҳисор', P.BEDDING, SD.BRIDE, 450, 12, 'Green patchwork quilt sewn by hand.jpg'),
    ('Фатаи тӯрии арӯс', 'Душанбе', P.VEIL, SD.BRIDE, 450, 7, 'Wedding veil and lips (Unsplash).jpg'),
    ('Фатаи дарози «Бурано»', 'Хуҷанд', P.VEIL, SD.BRIDE, 800, 3, 'Museum of Lace (Burano) 06.jpg'),
    ('Маҷмӯи косметикаи арӯс', 'Душанбе', P.COSMETICS, SD.BRIDE, 650, 10, 'Make Up Flat Lay for Background.jpg'),
    ('Лабсурхҳои тӯёна', 'Хуҷанд', P.COSMETICS, SD.BRIDE, 180, 25, 'Cosmetics-1078712 1280.jpg'),
    ('Шими классикии домод', 'Душанбе', P.TROUSERS, SD.GROOM, 400, 12, "Trousers, men's (AM 6325-1).jpg"),
    ('Гарданбанди тиллоӣ', 'Душанбе', P.JEWELRY, SD.BRIDE, 6500, 3, 'Gold necklace MET DP336810.jpg'),
    ('Ангуштариҳои никоҳ', 'Хуҷанд', P.JEWELRY, SD.BOTH, 3000, 6, 'Pair of gold wedding rings.JPG'),
]

REVIEWS = [
    (5, 'Ҳама чиз олӣ буд, ташаккури зиёд!'),
    (5, 'Хизматрасонии хеле хуб, ба ҳама тавсия медиҳам.'),
    (4, 'Хуб буд, фақат каме дер карданд.'),
    (5, 'Меҳмонон хеле қаноатманд монданд.'),
    (4, 'Нарх ва сифат мувофиқ аст.'),
    (3, 'Бад нест, аммо беҳтар шуда метавонад.'),
    (5, 'Тӯйи мо беҳтарин шуд!'),
]


class Images:
    """Downloads chosen Wikimedia Commons files once and reuses them (index in media/demo/index.json)."""

    API = 'https://commons.wikimedia.org/w/api.php'
    UA = {'User-Agent': 'WeddingDemoSeed/1.0 (local development)'}

    def __init__(self, enabled, stdout):
        self.enabled = enabled
        self.stdout = stdout
        self.folder = settings.MEDIA_ROOT / 'demo'
        self.index_file = self.folder / 'index.json'
        self.index = json.loads(self.index_file.read_text()) if self.index_file.exists() else {}

    def fetch(self, url):
        for attempt in range(5):
            time.sleep(1)
            try:
                return urlopen(Request(url, headers=self.UA), timeout=30).read()
            except Exception:
                if attempt == 4:
                    raise
                time.sleep(8 * (attempt + 1))

    def download(self, title):
        params = {'action': 'query', 'format': 'json', 'titles': f'File:{title}', 'prop': 'imageinfo',
                  'iiprop': 'url', 'iiurlwidth': 2560}
        pages = json.loads(self.fetch(f'{self.API}?{urlencode(params)}'))['query']['pages']
        info = next(iter(pages.values()))['imageinfo'][0]
        ext = 'png' if info['thumburl'].lower().endswith('.png') else 'jpg'
        name = f'demo/{len(self.index) + 1:03d}.{ext}'
        self.folder.mkdir(parents=True, exist_ok=True)
        (settings.MEDIA_ROOT / name).write_bytes(self.fetch(info['thumburl']))
        self.index[title] = {'file': name, 'page': info['descriptionurl']}
        self.index_file.write_text(json.dumps(self.index, ensure_ascii=False, indent=1))

    def attach(self, obj, title):
        if not self.enabled:
            return
        if title.startswith('local:'):
            return self.attach_local(obj, title.removeprefix('local:'))
        if title not in self.index:
            try:
                self.download(title)
            except Exception as error:
                self.stdout.write(f'  ! {title}: {error}')
                return
        name = self.index[title]['file']
        if obj.image.name != name:
            obj.image.name = name
            obj.save(update_fields=['image'])

    def attach_local(self, obj, filename):
        name = f'demo/local/{filename}'
        target = settings.MEDIA_ROOT / name
        if not target.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(LOCAL_IMAGES / filename, target)
        if obj.image.name != name:
            obj.image.name = name
            obj.save(update_fields=['image'])

    def write_credits(self):
        lines = [f"{v['file']}\t{title}\t{v['page']}" for title, v in self.index.items()]
        header = 'Суратҳо аз Wikimedia Commons (литсензияи ҳар файл дар саҳифаи он):\n'
        (self.folder / 'CREDITS.txt').write_text(header + '\n'.join(lines) + '\n')


class Command(BaseCommand):
    help = 'Бисёр маълумоти намунавӣ бо суратҳои озод аз Wikimedia Commons илова мекунад'

    def add_arguments(self, parser):
        parser.add_argument('--no-images', action='store_true', help='Суратҳоро зеркашӣ накардан')

    def handle(self, *args, **options):
        random.seed(42)
        images = Images(not options['no_images'], self.stdout)
        cities = {name: City.objects.get_or_create(name=name)[0] for name in CITIES}
        vendors = [self.user(f'vendor{i or ""}', 'vendor12345', User.Role.VENDOR) for i in range(3)]
        clients = [self.user(f'mehmon{i}', 'mehmon12345', User.Role.CLIENT) for i in range(1, 7)]

        def make(cls, name, city, image, **fields):
            phone = f'+992 9{random.randint(0, 9)} {random.randint(100, 999)} {random.randint(10, 99)} {random.randint(10, 99)}'
            obj, _ = cls.objects.get_or_create(
                name=name, defaults={'owner': random.choice(vendors), 'city': cities[city], 'phone': phone, **fields},
            )
            images.attach(obj, image)
            self.stdout.write(f'  ✓ {name}')
            return obj

        listings = []
        self.stdout.write('Тарабхонаҳо:')
        for name, city, address, capacity, price, image in RESTAURANTS:
            description = f'Толори зебо барои тӯй ва маъракаҳо дар шаҳри {city}. Ғунҷоиш то {capacity} нафар, ороиши ҳозира ва хизматрасонии хуб.'
            restaurant = make(Restaurant, name, city, image, address=address, capacity=capacity, price_per_person=price, description=description)
            listings.append(restaurant)

        self.stdout.write('Мошинҳо:')
        for name, city, brand, model, year, color, seats, price, image in CARS:
            description = f'{brand} {model} ({year}) барои кортежи тӯй. Мошин тоза ва ороишёфта, ронандаи ботаҷриба.'
            listings.append(make(Car, name, city, image, brand=brand, model=model, year=year, color=color, seats=seats, price_per_hour=price, description=description))

        self.stdout.write('Хизматҳо:')
        for name, city, category, price, years, image in SERVICES:
            description = f'{category.label} барои тӯйи шумо. Таҷрибаи {years}-сола, садҳо тӯйи хушҳол.'
            listings.append(make(Service, name, city, image, category=category, price=price, experience_years=years, description=description))

        self.stdout.write('Молҳо:')
        for name, city, category, side, price, stock, image in PRODUCTS:
            description = f'{category.label}. Сифати баланд, расонидан ба тамоми шаҳрҳои Тоҷикистон.'
            listings.append(make(Product, name, city, image, category=category, side=side, price=price, stock=stock, description=description))

        for obj in listings:
            field = obj._meta.model_name
            if Review.objects.filter(**{field: obj}).exists():
                continue
            for client in random.sample(clients, random.randint(1, 4)):
                rating, text = random.choice(REVIEWS)
                Review.objects.create(user=client, rating=rating, text=text, **{field: obj})

        if images.enabled:
            images.write_credits()
            call_command('tajik_plates', stdout=self.stdout)
        self.stdout.write(self.style.SUCCESS(
            f'Тайёр: {len(listings)} эълон. Фурӯшандагон: vendor, vendor1, vendor2 (vendor12345); мизоҷон: mehmon1…6 (mehmon12345)'
        ))

    def user(self, username, password, role):
        user, created = User.objects.get_or_create(username=username, defaults={'role': role})
        if created:
            user.set_password(password)
            user.save()
        return user
