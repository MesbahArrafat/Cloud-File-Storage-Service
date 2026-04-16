from rest_framework import serializers
from .models import Folder

MAX_FOLDER_DEPTH = 5


class FolderSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Folder
        fields = ('id', 'name', 'parent', 'user', 'children', 'created_at', 'updated_at')
        read_only_fields = ('user', 'created_at', 'updated_at')

    def get_children(self, obj):
        depth = self.context.get('depth', 0)
        if depth >= MAX_FOLDER_DEPTH:
            return []
        children = obj.children.prefetch_related('children').all()
        return FolderSerializer(
            children, many=True, context={**self.context, 'depth': depth + 1}
        ).data
