from rest_framework import serializers
from .models import Folder


class FolderSerializer(serializers.ModelSerializer):
    subfolder_count = serializers.SerializerMethodField()
    file_count = serializers.SerializerMethodField()
    full_path = serializers.SerializerMethodField()

    class Meta:
        model = Folder
        fields = ('id', 'name', 'parent', 'user', 'subfolder_count', 'file_count', 'full_path', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'subfolder_count', 'file_count', 'full_path', 'created_at', 'updated_at')

    def get_subfolder_count(self, obj):
        return obj.subfolders.count()

    def get_file_count(self, obj):
        return obj.files.filter(is_deleted=False).count()

    def get_full_path(self, obj):
        return obj.get_full_path()


class FolderDetailSerializer(FolderSerializer):
    subfolders = FolderSerializer(many=True, read_only=True)

    class Meta(FolderSerializer.Meta):
        fields = FolderSerializer.Meta.fields + ('subfolders',)
