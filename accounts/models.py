from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        CLIENT = 'client', 'Мизоҷ'
        VENDOR = 'vendor', 'Фурӯшанда'

    class Side(models.TextChoices):
        GROOM = 'groom', 'Домод'
        BRIDE = 'bride', 'Арӯс'

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CLIENT)
    side = models.CharField(max_length=10, choices=Side.choices, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(blank=True, null=True)

    @property
    def is_vendor(self):
        return self.role == self.Role.VENDOR or self.is_staff
