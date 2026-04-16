from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Folder
from .serializers import FolderSerializer, FolderDetailSerializer


class FolderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FolderSerializer

    def get_queryset(self):
        return Folder.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return FolderDetailSerializer
        return FolderSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset().filter(parent=None)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        folder = self.get_object()
        folder.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
