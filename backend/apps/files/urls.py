from django.urls import path
from .views import FileViewSet

file_list = FileViewSet.as_view({'get': 'list', 'post': 'create'})
file_detail = FileViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'})
file_download = FileViewSet.as_view({'get': 'download'})
file_preview = FileViewSet.as_view({'get': 'preview'})
file_restore = FileViewSet.as_view({'post': 'restore'})
file_permanent = FileViewSet.as_view({'delete': 'permanent_delete'})
file_trash = FileViewSet.as_view({'get': 'trash'})
file_starred = FileViewSet.as_view({'get': 'starred'})
file_zip = FileViewSet.as_view({'post': 'zip_download'})

urlpatterns = [
    path('', file_list, name='file-list'),
    path('<uuid:pk>/', file_detail, name='file-detail'),
    path('<uuid:pk>/download/', file_download, name='file-download'),
    path('<uuid:pk>/preview/', file_preview, name='file-preview'),
    path('<uuid:pk>/restore/', file_restore, name='file-restore'),
    path('<uuid:pk>/permanent/', file_permanent, name='file-permanent'),
    path('trash/', file_trash, name='file-trash'),
    path('starred/', file_starred, name='file-starred'),
    path('zip-download/', file_zip, name='file-zip'),
]
