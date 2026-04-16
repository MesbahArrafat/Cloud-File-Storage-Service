from django.urls import path
from .views import ChunkUploadInitView, ChunkUploadView, ChunkUploadCompleteView

urlpatterns = [
    path('init/', ChunkUploadInitView.as_view(), name='upload-init'),
    path('chunk/', ChunkUploadView.as_view(), name='upload-chunk'),
    path('complete/', ChunkUploadCompleteView.as_view(), name='upload-complete'),
]
