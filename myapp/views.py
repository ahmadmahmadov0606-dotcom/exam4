from django.db import transaction
from django.db.models import Avg, F, Q
from drf_yasg.utils import no_body, swagger_auto_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .models import (
    INACTIVE, Car, CarBooking, City, Notification, Order, Product, Restaurant,
    RestaurantBooking, RestaurantImage, Review, Service, ServiceBooking, Status, Wedding, WeddingExpense,
    WeddingGuest, WeddingTask,
)
from .permissions import IsOwnerOrReadOnly, IsVendorOrReadOnly
from .serializers import (
    CarBookingSerializer, CarSerializer, CitySerializer, NotificationSerializer,
    OrderSerializer, ProductSerializer, RestaurantBookingSerializer, RestaurantDetailSerializer, RestaurantImageSerializer,
    RestaurantSerializer, ReviewSerializer, ServiceBookingSerializer, ServiceSerializer, StatusSerializer,
    WeddingExpenseSerializer, WeddingGuestSerializer, WeddingSerializer, WeddingTaskSerializer,
)


def notify(user, text):
    Notification.objects.create(user=user, text=text)


def client_side(request):
    """'groom' or 'bride' for a client who chose a side at registration, else ''."""
    user = request.user
    return getattr(user, 'side', '') if user.is_authenticated and user.role == 'client' else ''


def is_schema(view):
    return getattr(view, 'swagger_fake_view', False)


class CityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    pagination_class = None
    search_fields = ['name']


class ListingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsVendorOrReadOnly, IsOwnerOrReadOnly]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'rating']

    def get_queryset(self):
        # Explicit order: Meta.ordering is dropped once the rating aggregate adds a GROUP BY.
        return self.queryset.select_related('owner', 'city').annotate(rating=Avg('reviews__rating')).order_by('-created_at', '-id')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, permission_classes=[IsAuthenticated])
    def mine(self, request):
        page = self.paginate_queryset(self.get_queryset().filter(owner=request.user))
        return self.get_paginated_response(self.get_serializer(page, many=True).data)


class RestaurantViewSet(ListingViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    filterset_fields = {'city': ['exact'], 'capacity': ['gte'], 'price_per_person': ['gte', 'lte']}
    ordering_fields = ListingViewSet.ordering_fields + ['price_per_person', 'capacity']

    def get_serializer_class(self):
        return RestaurantDetailSerializer if self.action == 'retrieve' else RestaurantSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.prefetch_related('gallery') if self.action == 'retrieve' else queryset

    @action(detail=True, permission_classes=[])
    def busy_dates(self, request, pk=None):
        dates = self.get_object().bookings.exclude(status__in=INACTIVE).values_list('date', flat=True)
        return Response(sorted(set(dates)))


class RestaurantImageViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    """Gallery photos of a restaurant; only its owner can add or delete them."""

    queryset = RestaurantImage.objects.select_related('restaurant')
    serializer_class = RestaurantImageSerializer
    permission_classes = [IsVendorOrReadOnly, IsOwnerOrReadOnly]
    filterset_fields = ['restaurant']


class CarViewSet(ListingViewSet):
    queryset = Car.objects.all()
    serializer_class = CarSerializer
    filterset_fields = {'city': ['exact'], 'brand': ['iexact'], 'with_driver': ['exact'], 'price_per_hour': ['gte', 'lte']}
    search_fields = ['name', 'brand', 'model', 'color']
    ordering_fields = ListingViewSet.ordering_fields + ['price_per_hour', 'year']


class ServiceViewSet(ListingViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    filterset_fields = {'city': ['exact'], 'category': ['exact', 'in'], 'price': ['gte', 'lte']}
    ordering_fields = ListingViewSet.ordering_fields + ['price', 'experience_years']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == 'list' and client_side(self.request) == 'groom':
            queryset = queryset.exclude(category=Service.Category.MAKEUP)
        return queryset


class ProductViewSet(ListingViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filterset_fields = {'city': ['exact'], 'category': ['exact', 'in'], 'side': ['exact'], 'price': ['gte', 'lte']}
    ordering_fields = ListingViewSet.ordering_fields + ['price']

    def get_queryset(self):
        # A groom or bride only browses products meant for their side (plus shared ones).
        queryset = super().get_queryset()
        side = client_side(self.request)
        if self.action == 'list' and side:
            queryset = queryset.filter(side__in=[side, Product.Side.BOTH])
        return queryset


class BookingViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    target = None
    filterset_fields = ['status']

    def get_queryset(self):
        if is_schema(self):
            return self.queryset.none()
        user = self.request.user
        return self.queryset.filter(Q(user=user) | Q(**{f'{self.target}__owner': user})).select_related('user', self.target)

    def item(self, booking):
        return getattr(booking, self.target)

    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)
        notify(self.item(booking).owner, f'Дархости нав: {booking}')

    def release(self, booking):
        pass

    @swagger_auto_schema(request_body=no_body)
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.user != request.user:
            raise PermissionDenied('Шумо танҳо бронҳои худро бекор карда метавонед.')
        if booking.status not in (Status.PENDING, Status.CONFIRMED):
            raise ValidationError({'status': ['Ин бронро бекор кардан мумкин нест.']})
        booking.status = Status.CANCELLED
        booking.save(update_fields=['status'])
        self.release(booking)
        notify(self.item(booking).owner, f'Брон бекор шуд: {booking}')
        return Response(self.get_serializer(booking).data)

    @swagger_auto_schema(request_body=StatusSerializer)
    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        booking = self.get_object()
        if self.item(booking).owner != request.user:
            raise PermissionDenied('Шумо танҳо бронҳои объектҳои худро тағйир дода метавонед.')
        if booking.status in INACTIVE:
            raise ValidationError({'status': ['Ин брон аллакай бекор ё рад шудааст.']})
        serializer = StatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking.status = serializer.validated_data['status']
        booking.save(update_fields=['status'])
        if booking.status == Status.REJECTED:
            self.release(booking)
        notify(booking.user, f'{booking}: {booking.get_status_display()}')
        return Response(self.get_serializer(booking).data)


class RestaurantBookingViewSet(BookingViewSet):
    queryset = RestaurantBooking.objects.all()
    serializer_class = RestaurantBookingSerializer
    target = 'restaurant'


class CarBookingViewSet(BookingViewSet):
    queryset = CarBooking.objects.all()
    serializer_class = CarBookingSerializer
    target = 'car'


class ServiceBookingViewSet(BookingViewSet):
    queryset = ServiceBooking.objects.all()
    serializer_class = ServiceBookingSerializer
    target = 'service'


class OrderViewSet(BookingViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    target = 'product'

    @transaction.atomic
    def perform_create(self, serializer):
        super().perform_create(serializer)
        Product.objects.filter(pk=serializer.instance.product_id).update(stock=F('stock') - serializer.instance.quantity)

    def release(self, order):
        Product.objects.filter(pk=order.product_id).update(stock=F('stock') + order.quantity)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related('user')
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filterset_fields = ['restaurant', 'car', 'service', 'product', 'rating']

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WeddingViewSet(viewsets.ModelViewSet):
    serializer_class = WeddingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if is_schema(self):
            return Wedding.objects.none()
        return Wedding.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class WeddingChildViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filterset_fields = ['wedding']

    def get_queryset(self):
        if is_schema(self):
            return self.queryset.none()
        return self.queryset.filter(wedding__owner=self.request.user)


class WeddingGuestViewSet(WeddingChildViewSet):
    queryset = WeddingGuest.objects.all()
    serializer_class = WeddingGuestSerializer
    filterset_fields = ['wedding', 'side', 'is_confirmed']
    search_fields = ['name', 'phone']


class WeddingTaskViewSet(WeddingChildViewSet):
    queryset = WeddingTask.objects.all()
    serializer_class = WeddingTaskSerializer
    filterset_fields = ['wedding', 'is_done']


class WeddingExpenseViewSet(WeddingChildViewSet):
    queryset = WeddingExpense.objects.all()
    serializer_class = WeddingExpenseSerializer


class NotificationViewSet(mixins.ListModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_read']

    def get_queryset(self):
        if is_schema(self):
            return Notification.objects.none()
        return self.request.user.notifications.all()

    @swagger_auto_schema(request_body=no_body)
    @action(detail=False, methods=['post'])
    def read_all(self, request):
        self.get_queryset().update(is_read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)
