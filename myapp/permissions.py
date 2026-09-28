from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsVendorOrReadOnly(BasePermission):
    message = 'Танҳо фурӯшандагон эълон илова карда метавонанд.'

    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or (request.user.is_authenticated and request.user.is_vendor)


class IsOwnerOrReadOnly(BasePermission):
    message = 'Шумо соҳиби ин объект нестед.'

    def has_object_permission(self, request, view, obj):
        return request.method in SAFE_METHODS or obj.owner == request.user
