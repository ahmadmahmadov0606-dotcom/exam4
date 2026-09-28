from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

User = settings.AUTH_USER_MODEL
positive = [MinValueValidator(0)]


def money(**kwargs):
    return models.DecimalField(max_digits=12, decimal_places=2, validators=positive, **kwargs)


class Status(models.TextChoices):
    PENDING = 'pending', 'Дар интизорӣ'
    CONFIRMED = 'confirmed', 'Тасдиқ шуд'
    REJECTED = 'rejected', 'Рад шуд'
    CANCELLED = 'cancelled', 'Бекор шуд'
    COMPLETED = 'completed', 'Анҷом ёфт'


INACTIVE = [Status.REJECTED, Status.CANCELLED]


class City(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name_plural = 'Cities'

    def __str__(self):
        return self.name


class Listing(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    city = models.ForeignKey(City, on_delete=models.PROTECT)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    image = models.ImageField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Restaurant(Listing):
    address = models.CharField(max_length=255)
    capacity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    price_per_person = money()
    video = models.FileField(upload_to='restaurants/videos/', blank=True, null=True)


class RestaurantImage(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='gallery')
    image = models.ImageField(upload_to='restaurants/gallery/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at', 'id']

    @property
    def owner(self):
        return self.restaurant.owner

    def __str__(self):
        return f'{self.restaurant} — сурат {self.pk}'


class Car(Listing):
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField(validators=[MinValueValidator(1950)])
    color = models.CharField(max_length=50)
    seats = models.PositiveIntegerField(default=4)
    with_driver = models.BooleanField(default=True)
    price_per_hour = money()
    # This car's own 3D model (glTF binary), made from its photo. Without it 3D shows the photo.
    model_3d = models.FileField(upload_to='cars/3d/', blank=True, null=True)
    # A wide photo of the interior, shown when you step inside in 3D; the credit names its author/licence.
    interior = models.ImageField(upload_to='cars/interior/', blank=True, null=True)
    interior_credit = models.CharField(max_length=255, blank=True)
    # Depth of the interior photo (white = near), made by `manage.py interior_depth`; turns the photo into 3D.
    interior_depth = models.ImageField(upload_to='cars/interior/', blank=True, null=True)


class Service(Listing):
    class Category(models.TextChoices):
        SINGER = 'singer', 'Ҳофиз'
        MUSICIANS = 'musicians', 'Созандагон'
        HOST = 'host', 'Тамада / Ведущий'
        PHOTOGRAPHER = 'photographer', 'Суратгир'
        VIDEOGRAPHER = 'videographer', 'Видеограф'
        MAKEUP = 'makeup', 'Ороишгари арӯс'
        DECOR = 'decor', 'Ороиши толор'
        CAKE = 'cake', 'Торт ва ширинӣ'

    category = models.CharField(max_length=20, choices=Category.choices)
    price = money()
    experience_years = models.PositiveIntegerField(default=0)


class Product(Listing):
    class Category(models.TextChoices):
        GROOM_NATIONAL = 'groom_national', 'Либоси миллии домод (чапон, тоқӣ)'
        GROOM_SUIT = 'groom_suit', 'Костюми домод'
        BRIDE_DRESS = 'bride_dress', 'Либоси арӯсӣ'
        BRIDE_NATIONAL = 'bride_national', 'Либоси миллии арӯс'
        VEIL = 'veil', 'Фатаи арӯс'
        COSMETICS = 'cosmetics', 'Косметика'
        TROUSERS = 'trousers', 'Шими домод'
        FURNITURE = 'furniture', 'Мебел (сеп)'
        BEDDING = 'bedding', 'Кӯрпа ва кӯрпача'
        JEWELRY = 'jewelry', 'Заргарӣ'

    class Side(models.TextChoices):
        GROOM = 'groom', 'Тарафи домод'
        BRIDE = 'bride', 'Тарафи арӯс'
        BOTH = 'both', 'Ҳарду'

    class TryOn(models.TextChoices):
        UPPER = 'upper', 'Боло (куртка, чапон)'
        LOWER = 'lower', 'Поён (шим)'
        FULL = 'full', 'Пурра (либоси дароз)'
        NONE = 'none', 'Пӯшонда намешавад'

    category = models.CharField(max_length=20, choices=Category.choices)
    side = models.CharField(max_length=10, choices=Side.choices, default=Side.BOTH)
    price = money()
    stock = models.PositiveIntegerField(default=1)
    # Which part of the body the AI fitting room dresses; 'none' hides the product from try-on.
    tryon_category = models.CharField(max_length=10, choices=TryOn.choices, default=TryOn.UPPER)


class BaseBooking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    comment = models.TextField(blank=True)
    total_price = money(default=0)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class TimeBooking(BaseBooking):
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta(BaseBooking.Meta):
        abstract = True


class RestaurantBooking(BaseBooking):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='bookings')
    guests = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    def __str__(self):
        return f'{self.restaurant} — {self.date}'


class CarBooking(TimeBooking):
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='bookings')

    def __str__(self):
        return f'{self.car} — {self.date}'


class ServiceBooking(TimeBooking):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='bookings')

    def __str__(self):
        return f'{self.service} — {self.date}'


class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='orders')
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    address = models.CharField(max_length=255)
    total_price = money(default=0)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.product} x {self.quantity}'


class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    car = models.ForeignKey(Car, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def owner(self):
        return self.user

    def __str__(self):
        return f'{self.user} — {self.rating}★'


class Wedding(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    date = models.DateField()
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True, blank=True)
    budget = money(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return self.title


class WeddingGuest(models.Model):
    class Side(models.TextChoices):
        GROOM = 'groom', 'Тарафи домод'
        BRIDE = 'bride', 'Тарафи арӯс'

    wedding = models.ForeignKey(Wedding, on_delete=models.CASCADE, related_name='guests')
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)
    side = models.CharField(max_length=10, choices=Side.choices)
    people_count = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    is_confirmed = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class WeddingTask(models.Model):
    wedding = models.ForeignKey(Wedding, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    deadline = models.DateField(null=True, blank=True)
    is_done = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class WeddingExpense(models.Model):
    wedding = models.ForeignKey(Wedding, on_delete=models.CASCADE, related_name='expenses')
    title = models.CharField(max_length=200)
    amount = money()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.title}: {self.amount}'


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    text = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.text
