from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
import os

from django.urls import include, path
from django.views.generic import RedirectView
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

schema_view = get_schema_view(
    openapi.Info(title='Wedding API', default_version='v1', description='API барои ташкили тӯй'),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    # The API server has no pages of its own; send visitors to the website.
    path('', RedirectView.as_view(url=os.getenv('FRONTEND_URL', 'http://localhost:5173/'))),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('myapp.urls')),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='swagger'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='redoc'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
