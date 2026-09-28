from django.urls import path
from rest_framework.routers import DefaultRouter

from .assistant_views import AssistantView
from .tryon_views import TryOnStatusView, TryOnView
from .views import (
    CarBookingViewSet, CarViewSet, CityViewSet, NotificationViewSet, OrderViewSet,
    ProductViewSet, RestaurantBookingViewSet, RestaurantImageViewSet, RestaurantViewSet, ReviewViewSet, ServiceBookingViewSet,
    ServiceViewSet, WeddingExpenseViewSet, WeddingGuestViewSet, WeddingTaskViewSet, WeddingViewSet,
)

router = DefaultRouter()
router.register('cities', CityViewSet)
router.register('restaurants', RestaurantViewSet)
router.register('restaurant-images', RestaurantImageViewSet)
router.register('cars', CarViewSet)
router.register('services', ServiceViewSet)
router.register('products', ProductViewSet)
router.register('restaurant-bookings', RestaurantBookingViewSet)
router.register('car-bookings', CarBookingViewSet)
router.register('service-bookings', ServiceBookingViewSet)
router.register('orders', OrderViewSet)
router.register('reviews', ReviewViewSet)
router.register('weddings', WeddingViewSet, basename='wedding')
router.register('wedding-guests', WeddingGuestViewSet)
router.register('wedding-tasks', WeddingTaskViewSet)
router.register('wedding-expenses', WeddingExpenseViewSet)
router.register('notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('tryon/', TryOnView.as_view()),
    path('tryon/status/', TryOnStatusView.as_view()),
    path('assistant/', AssistantView.as_view()),
] + router.urls
