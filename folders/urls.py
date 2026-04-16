from django.urls import path
from .views import FolderListCreateView, FolderDetailView

urlpatterns = [
    path('', FolderListCreateView.as_view()),
    path('<int:pk>/', FolderDetailView.as_view()),
]
