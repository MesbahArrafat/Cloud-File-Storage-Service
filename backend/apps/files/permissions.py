from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsFileOwnerOrPermitted(BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj.user == request.user:
            return True
        if obj.is_public:
            return True
        if request.user.is_authenticated:
            perm = obj.permissions.filter(user=request.user).first()
            if perm and perm.can_view:
                return True
        return False
