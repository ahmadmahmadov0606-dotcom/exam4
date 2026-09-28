from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'phone', 'role', 'side', 'is_staff']
    list_filter = ['role', 'side', 'is_staff', 'is_active']
    search_fields = ['username', 'email', 'phone']
    fieldsets = UserAdmin.fieldsets + (('Иловагӣ', {'fields': ('role', 'side', 'phone', 'avatar')}),)
