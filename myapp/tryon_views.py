import io
import uuid

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image, ImageOps, UnidentifiedImageError
from rest_framework import permissions, serializers, status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import Product
from django.conf import settings

from .tryon import TryOnError, TryOnQuota, TryOnTimeout, describe, run_tryon, status as provider_status

# Garments the AI can put on a person (hats, jewellery, furniture… are not wearable this way).
WEARABLE = [
    Product.Category.GROOM_SUIT,
    Product.Category.TROUSERS,
    Product.Category.GROOM_NATIONAL,
    Product.Category.BRIDE_DRESS,
    Product.Category.BRIDE_NATIONAL,
]


def to_jpeg(file_or_bytes, max_side=1536):
    """Upright, EXIF-free JPEG no larger than max_side — smaller upload, and no GPS data leaves the server."""
    image = Image.open(file_or_bytes if hasattr(file_or_bytes, 'read') else io.BytesIO(file_or_bytes))
    image = ImageOps.exif_transpose(image).convert('RGB')
    image.thumbnail((max_side, max_side))
    buffer = io.BytesIO()
    image.save(buffer, 'JPEG', quality=90)
    return buffer.getvalue()


class TryOnSerializer(serializers.Serializer):
    photo = serializers.ImageField()
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(category__in=WEARABLE))

    def validate_photo(self, photo):
        if photo.size > 10 * 1024 * 1024:
            raise serializers.ValidationError('Сурат бояд аз 10 МБ хурдтар бошад.')
        return photo

    def validate_product(self, product):
        if not product.image:
            raise serializers.ValidationError('Ин мол сурат надорад.')
        if product.tryon_category not in provider_status()['supports']:
            raise serializers.ValidationError('Ин либосро ҳоло пӯшонда наметавонем.')
        return product


class TryOnStatusView(APIView):
    """Which try-on provider would be used right now (fashn, huggingface or none)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(provider_status())


class TryOnView(APIView):
    """GET: is the service on? POST photo + product: returns a photo of the user wearing the product."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]
    throttle_scope = 'tryon'

    def get_throttles(self):
        return [ScopedRateThrottle()] if self.request.method == 'POST' else []

    def get(self, request):
        return Response({'enabled': provider_status()['active'] is not None, 'categories': WEARABLE})

    def post(self, request):
        serializer = TryOnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data['product']

        try:
            photo = Image.open(serializer.validated_data['photo'])
            person = ImageOps.exif_transpose(photo).convert('RGB')  # upright, EXIF (GPS) dropped
            person.thumbnail((1536, 1536))
            with product.image.open('rb') as f:
                garment = f.read()
        except (UnidentifiedImageError, OSError):
            return Response({'photo': ['Суратро хондан нашуд. JPG ё PNG бор кунед.']}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result, provider, face_restored = run_tryon(person, garment, product.tryon_category, describe(product))
        except TryOnError as error:
            if isinstance(error, TryOnQuota):
                detail, code = 'Квотаи ройгони AI тамом шуд. Баъдтар кӯшиш кунед.', status.HTTP_429_TOO_MANY_REQUESTS
            elif isinstance(error, TryOnTimeout):
                detail, code = 'Хизмати AI бедор мешавад. Пас аз як дақиқа боз кӯшиш кунед.', status.HTTP_504_GATEWAY_TIMEOUT
            else:
                detail, code = 'Хизмати AI ҳоло банд аст. Баъдтар кӯшиш кунед.', status.HTTP_503_SERVICE_UNAVAILABLE
            body = {'detail': detail}
            if settings.DEBUG:
                body['detail_debug'] = str(error)
            return Response(body, status=code)

        name = default_storage.save(f'tryon/{uuid.uuid4().hex}.jpg', ContentFile(result))
        return Response({
            'image': request.build_absolute_uri(default_storage.url(name)),
            'product': product.id,
            'provider': provider,
            'face_restored': face_restored,
        })
