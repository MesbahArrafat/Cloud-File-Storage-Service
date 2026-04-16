from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from .models import Folder
from .serializers import FolderSerializer


class FolderListCreateView(generics.ListCreateAPIView):
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Folder.objects.filter(user=self.request.user).prefetch_related('children')

    def perform_create(self, serializer):
        parent = serializer.validated_data.get('parent')
        if parent and parent.user != self.request.user:
            raise PermissionDenied('Parent folder does not belong to you.')
        serializer.save(user=self.request.user)


class FolderDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Folder.objects.filter(user=self.request.user).prefetch_related('children')
