from django.contrib import admin

from .models import (
    Car, CarBooking, City, Notification, Order, Product, Restaurant, RestaurantBooking, RestaurantImage,
    Review, Service, ServiceBooking, Wedding, WeddingExpense, WeddingGuest, WeddingTask,
)


class RestaurantImageInline(admin.TabularInline):
    model = RestaurantImage
    extra = 1


class GuestInline(admin.TabularInline):
    model = WeddingGuest
    extra = 0


class TaskInline(admin.TabularInline):
    model = WeddingTask
    extra = 0


class ExpenseInline(admin.TabularInline):
    model = WeddingExpense
    extra = 0


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    search_fields = ['name']


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'owner', 'capacity', 'price_per_person']
    list_filter = ['city']
    search_fields = ['name', 'address']
    inlines = [RestaurantImageInline]


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ['name', 'brand', 'model', 'year', 'city', 'price_per_hour']
    list_filter = ['city', 'brand', 'with_driver']
    search_fields = ['name', 'brand', 'model']


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'city', 'price']
    list_filter = ['category', 'city']
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'side', 'price', 'stock', 'tryon_category']
    list_filter = ['category', 'side', 'tryon_category', 'city']
    list_editable = ['tryon_category']
    search_fields = ['name']


class BookingAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'user', 'date', 'total_price', 'status']
    list_filter = ['status', 'date']


admin.site.register([RestaurantBooking, CarBooking, ServiceBooking], BookingAdmin)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'quantity', 'total_price', 'status']
    list_filter = ['status']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['user', 'rating', 'restaurant', 'car', 'service', 'product']
    list_filter = ['rating']


@admin.register(Wedding)
class WeddingAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'date', 'city', 'budget']
    list_filter = ['city']
    search_fields = ['title']
    inlines = [GuestInline, TaskInline, ExpenseInline]


admin.site.register([WeddingGuest, WeddingTask, WeddingExpense])


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'text', 'is_read', 'created_at']
    list_filter = ['is_read']
