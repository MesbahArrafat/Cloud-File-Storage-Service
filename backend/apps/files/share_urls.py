from django.urls import path
from .views import ShareTokenView, PublicShareView, FilePermissionView

urlpatterns = [
    path('<uuid:file_id>/generate/', ShareTokenView.as_view(), name='share-generate'),
    path('<uuid:token>/', PublicShareView.as_view(), name='share-public'),
    path('<uuid:file_id>/permissions/', FilePermissionView.as_view(), name='share-permissions'),
]
