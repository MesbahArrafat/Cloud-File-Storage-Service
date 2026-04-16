from rest_framework import serializers
from .models import Folder


class FolderSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Folder
        fields = ('id', 'name', 'parent', 'user', 'children', 'created_at', 'updated_at')
        read_only_fields = ('user', 'created_at', 'updated_at')

    def get_children(self, obj):
        children = obj.children.all()
        return FolderSerializer(children, many=True).data
