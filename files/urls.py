from django.urls import path
from . import views

urlpatterns = [
    path('files/', views.FileListView.as_view()),
    path('files/zip/', views.ZipDownloadView.as_view()),
    path('files/<int:pk>/', views.FileDetailView.as_view()),
    path('files/<int:pk>/download/', views.FileDownloadView.as_view()),
    path('files/<int:pk>/share/', views.FileShareLinkView.as_view()),
    path('files/<int:pk>/share/user/', views.FileShareWithUserView.as_view()),
    path('files/<int:pk>/star/', views.StarToggleView.as_view()),
    path('files/<int:pk>/preview/', views.PreviewView.as_view()),
    path('upload/', views.FileUploadView.as_view()),
    path('upload/chunk/init/', views.ChunkUploadInitView.as_view()),
    path('upload/chunk/<uuid:upload_id>/', views.ChunkUploadView.as_view()),
    path('upload/chunk/<uuid:upload_id>/complete/', views.ChunkUploadCompleteView.as_view()),
    path('share/<uuid:token>/', views.ShareAccessView.as_view()),
    path('search/', views.SearchView.as_view()),
    path('trash/', views.TrashListView.as_view()),
    path('trash/<int:pk>/restore/', views.TrashRestoreView.as_view()),
    path('star/', views.StarredListView.as_view()),
    path('activity/', views.ActivityLogView.as_view()),
]
