from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers

from .models import (
    INACTIVE, Car, CarBooking, City, Notification, Order, Product, Restaurant,
    RestaurantBooking, RestaurantImage, Review, Service, ServiceBooking, Status, Wedding, WeddingExpense,
    WeddingGuest, WeddingTask,
)

LISTING_FIELDS = ['id', 'owner', 'city', 'city_name', 'name', 'description', 'phone', 'image', 'rating', 'created_at']


def error(field, message):
    return serializers.ValidationError({field: [message]})


def check_not_past(date):
    if date < timezone.localdate():
        raise error('date', 'Санаи гузаштаро брон кардан мумкин нест.')


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'name']


class ListingSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    city_name = serializers.ReadOnlyField(source='city.name')
    rating = serializers.FloatField(read_only=True)


VIDEO_EXTENSIONS = ('.mp4', '.webm')
VIDEO_MAX_MB = 15


class RestaurantSerializer(ListingSerializer):
    class Meta:
        model = Restaurant
        fields = LISTING_FIELDS + ['address', 'capacity', 'price_per_person', 'video']

    def validate_video(self, video):
        if not video:
            return video
        if not video.name.lower().endswith(VIDEO_EXTENSIONS):
            raise serializers.ValidationError('Танҳо видеои MP4 ё WebM бор кунед.')
        if video.size > VIDEO_MAX_MB * 1024 * 1024:
            raise serializers.ValidationError(f'Видео бояд аз {VIDEO_MAX_MB} МБ хурдтар бошад.')
        return video


class RestaurantImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestaurantImage
        fields = ['id', 'restaurant', 'image', 'created_at']
        read_only_fields = ['created_at']

    def validate_restaurant(self, restaurant):
        if restaurant.owner != self.context['request'].user:
            raise serializers.ValidationError('Ин тарабхона аз они шумо нест.')
        return restaurant


class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestaurantImage
        fields = ['id', 'image']


class RestaurantDetailSerializer(RestaurantSerializer):
    gallery = GalleryImageSerializer(many=True, read_only=True)

    class Meta(RestaurantSerializer.Meta):
        fields = RestaurantSerializer.Meta.fields + ['gallery']


class CarSerializer(ListingSerializer):
    class Meta:
        model = Car
        fields = LISTING_FIELDS + ['brand', 'model', 'year', 'color', 'seats', 'with_driver', 'price_per_hour', 'model_3d', 'interior', 'interior_credit', 'interior_depth']

    def validate_model_3d(self, value):
        if value and not value.name.lower().endswith('.glb'):
            raise serializers.ValidationError('Танҳо файли 3D-и GLB бор кунед.')
        if value and value.size > 30 * 1024 * 1024:
            raise serializers.ValidationError('3D-модел бояд аз 30 МБ хурдтар бошад.')
        return value


class ServiceSerializer(ListingSerializer):
    class Meta:
        model = Service
        fields = LISTING_FIELDS + ['category', 'price', 'experience_years']


class ProductSerializer(ListingSerializer):
    class Meta:
        model = Product
        fields = LISTING_FIELDS + ['category', 'side', 'price', 'stock', 'tryon_category']


BOOKING_FIELDS = ['id', 'user', 'date', 'comment', 'total_price', 'status', 'created_at']
BOOKING_READONLY = ['total_price', 'status', 'created_at']


class RestaurantBookingSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = RestaurantBooking
        fields = BOOKING_FIELDS + ['restaurant', 'guests']
        read_only_fields = BOOKING_READONLY

    def validate(self, attrs):
        restaurant, date, guests = attrs['restaurant'], attrs['date'], attrs['guests']
        check_not_past(date)
        if guests > restaurant.capacity:
            raise error('guests', f'Ғунҷоиши тарабхона {restaurant.capacity} нафар аст.')
        if restaurant.bookings.filter(date=date).exclude(status__in=INACTIVE).exists():
            raise error('date', 'Дар ин сана тарабхона аллакай брон шудааст.')
        attrs['total_price'] = guests * restaurant.price_per_person
        return attrs


class TimeBookingSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    target = None

    def validate(self, attrs):
        obj, date, start, end = attrs[self.target], attrs['date'], attrs['start_time'], attrs['end_time']
        check_not_past(date)
        if end <= start:
            raise error('end_time', 'Вақти анҷом бояд баъд аз вақти оғоз бошад.')
        busy = obj.bookings.filter(date=date, start_time__lt=end, end_time__gt=start).exclude(status__in=INACTIVE)
        if busy.exists():
            raise error('start_time', 'Дар ин вақт аллакай брон шудааст.')
        attrs['total_price'] = self.get_price(obj, start, end)
        return attrs


class CarBookingSerializer(TimeBookingSerializer):
    target = 'car'

    class Meta:
        model = CarBooking
        fields = BOOKING_FIELDS + ['car', 'start_time', 'end_time']
        read_only_fields = BOOKING_READONLY

    def get_price(self, car, start, end):
        minutes = (end.hour * 60 + end.minute) - (start.hour * 60 + start.minute)
        return round(car.price_per_hour * Decimal(minutes) / 60, 2)


class ServiceBookingSerializer(TimeBookingSerializer):
    target = 'service'

    class Meta:
        model = ServiceBooking
        fields = BOOKING_FIELDS + ['service', 'start_time', 'end_time']
        read_only_fields = BOOKING_READONLY

    def get_price(self, service, start, end):
        return service.price


class OrderSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Order
        fields = ['id', 'user', 'product', 'quantity', 'address', 'total_price', 'status', 'created_at']
        read_only_fields = BOOKING_READONLY

    def validate(self, attrs):
        product, quantity = attrs['product'], attrs['quantity']
        if quantity > product.stock:
            raise error('quantity', f'Дар анбор танҳо {product.stock} дона мавҷуд аст.')
        attrs['total_price'] = quantity * product.price
        return attrs


class StatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[Status.CONFIRMED, Status.REJECTED, Status.COMPLETED])


class ReviewSerializer(serializers.ModelSerializer):
    TARGETS = ['restaurant', 'car', 'service', 'product']
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Review
        fields = ['id', 'user', 'restaurant', 'car', 'service', 'product', 'rating', 'text', 'created_at']

    def validate(self, attrs):
        targets = [attrs.get(f, getattr(self.instance, f, None)) for f in self.TARGETS]
        if sum(t is not None for t in targets) != 1:
            raise error('non_field_errors', 'Танҳо як объектро барои шарҳ интихоб кунед.')
        return attrs


class WeddingSerializer(serializers.ModelSerializer):
    spent = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()

    class Meta:
        model = Wedding
        fields = ['id', 'title', 'date', 'city', 'budget', 'spent', 'remaining', 'created_at']

    def validate_date(self, value):
        if not self.instance and value < timezone.localdate():
            raise serializers.ValidationError('Санаи тӯй набояд дар гузашта бошад.')
        return value

    def get_spent(self, obj):
        return obj.expenses.aggregate(total=Sum('amount'))['total'] or 0

    def get_remaining(self, obj):
        return obj.budget - self.get_spent(obj)


class OwnWeddingMixin:
    def validate_wedding(self, wedding):
        if wedding.owner != self.context['request'].user:
            raise serializers.ValidationError('Ин тӯй аз они шумо нест.')
        return wedding


class WeddingGuestSerializer(OwnWeddingMixin, serializers.ModelSerializer):
    class Meta:
        model = WeddingGuest
        fields = ['id', 'wedding', 'name', 'phone', 'side', 'people_count', 'is_confirmed']


class WeddingTaskSerializer(OwnWeddingMixin, serializers.ModelSerializer):
    class Meta:
        model = WeddingTask
        fields = ['id', 'wedding', 'title', 'deadline', 'is_done']


class WeddingExpenseSerializer(OwnWeddingMixin, serializers.ModelSerializer):
    class Meta:
        model = WeddingExpense
        fields = ['id', 'wedding', 'title', 'amount', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'text', 'is_read', 'created_at']
        read_only_fields = ['id', 'text', 'created_at']
