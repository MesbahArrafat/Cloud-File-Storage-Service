from rest_framework import serializers
from django.contrib.auth.models import User
from .models import File, FileShare, ActivityLog, ChunkUpload
from folders.models import Folder


class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = (
            'id', 'user', 'folder', 'file', 'filename', 'size',
            'hash', 'is_public', 'share_token', 'is_deleted',
            'is_starred', 'created_at', 'updated_at',
        )
        read_only_fields = ('user', 'hash', 'share_token', 'size', 'created_at', 'updated_at')


class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    filename = serializers.CharField(max_length=255, required=False)
    folder = serializers.PrimaryKeyRelatedField(
        queryset=Folder.objects.all(),
        required=False,
        allow_null=True,
    )
    is_public = serializers.BooleanField(default=False)


class FileShareSerializer(serializers.ModelSerializer):
    shared_with_username = serializers.CharField(source='shared_with.username', read_only=True)

    class Meta:
        model = FileShare
        fields = ('id', 'file', 'shared_with', 'shared_with_username', 'created_at')
        read_only_fields = ('created_at',)


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = ('id', 'user', 'file', 'action', 'timestamp', 'details')


class ChunkUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChunkUpload
        fields = ('id', 'upload_id', 'filename', 'total_chunks', 'uploaded_chunks', 'folder', 'completed', 'created_at')
        read_only_fields = ('upload_id', 'uploaded_chunks', 'completed', 'created_at')
