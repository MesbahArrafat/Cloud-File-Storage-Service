import mimetypes
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import File, FilePermission, ChunkUpload
from .utils import compute_sha256, find_duplicate_file

User = get_user_model()


class FileSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()
    preview_url = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = ('id', 'filename', 'original_filename', 'size', 'hash', 'folder', 'user',
                  'is_public', 'share_token', 'is_deleted', 'is_starred', 'mime_type',
                  'download_url', 'preview_url', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'size', 'hash', 'share_token', 'mime_type',
                            'original_filename', 'created_at', 'updated_at')

    def get_download_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(f'/files/{obj.id}/download/') if request else None

    def get_preview_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(f'/files/{obj.id}/preview/') if request else None


class FileUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField()
    folder = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = File
        fields = ('file', 'folder', 'is_public')

    def validate_file(self, value):
        max_size = getattr(settings, 'MAX_FILE_SIZE_BYTES', 100 * 1024 * 1024)
        if value.size > max_size:
            raise serializers.ValidationError(f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit.")
        return value

    def validate_folder(self, value):
        if value is None:
            return None
        from apps.folders.models import Folder
        user = self.context['request'].user
        try:
            return Folder.objects.get(id=value, user=user)
        except Folder.DoesNotExist:
            raise serializers.ValidationError("Folder not found.")

    def create(self, validated_data):
        request = self.context['request']
        user = request.user
        uploaded_file = validated_data['file']
        folder = validated_data.get('folder')
        is_public = validated_data.get('is_public', False)

        mime_type, _ = mimetypes.guess_type(uploaded_file.name)
        if not mime_type:
            mime_type = 'application/octet-stream'

        file_hash = compute_sha256(uploaded_file)
        existing = find_duplicate_file(file_hash, user)
        if existing:
            return existing

        file_obj = File.objects.create(
            file=uploaded_file,
            filename=uploaded_file.name,
            original_filename=uploaded_file.name,
            size=uploaded_file.size,
            hash=file_hash,
            folder=folder,
            user=user,
            is_public=is_public,
            mime_type=mime_type,
        )
        user.storage_used += uploaded_file.size
        user.save(update_fields=['storage_used'])
        return file_obj


class FileUpdateSerializer(serializers.ModelSerializer):
    folder = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = File
        fields = ('filename', 'folder', 'is_public', 'is_starred')

    def validate_folder(self, value):
        if value is None:
            return None
        from apps.folders.models import Folder
        user = self.context['request'].user
        try:
            return Folder.objects.get(id=value, user=user)
        except Folder.DoesNotExist:
            raise serializers.ValidationError("Folder not found.")

    def update(self, instance, validated_data):
        folder = validated_data.pop('folder', 'NOT_SET')
        if folder != 'NOT_SET':
            instance.folder = folder
        return super().update(instance, validated_data)


class FilePermissionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    shared_with_email = serializers.EmailField(write_only=True)

    class Meta:
        model = FilePermission
        fields = ('id', 'file', 'user', 'user_email', 'shared_with_email', 'can_view', 'can_download', 'created_at')
        read_only_fields = ('id', 'file', 'user', 'user_email', 'created_at')

    def validate_shared_with_email(self, value):
        try:
            return User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No user found with this email.")

    def create(self, validated_data):
        shared_user = validated_data.pop('shared_with_email')
        file = validated_data['file']
        if file.user == shared_user:
            raise serializers.ValidationError("Cannot share a file with its owner.")
        perm, _ = FilePermission.objects.update_or_create(
            file=file, user=shared_user,
            defaults={'can_view': validated_data.get('can_view', True),
                      'can_download': validated_data.get('can_download', False)}
        )
        return perm


class ChunkUploadInitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChunkUpload
        fields = ('upload_id', 'filename', 'total_chunks', 'created_at')
        read_only_fields = ('upload_id', 'created_at')


class ChunkSerializer(serializers.Serializer):
    upload_id = serializers.UUIDField()
    chunk_index = serializers.IntegerField(min_value=0)
    chunk = serializers.FileField()

    def validate_upload_id(self, value):
        user = self.context['request'].user
        try:
            return ChunkUpload.objects.get(upload_id=value, user=user)
        except ChunkUpload.DoesNotExist:
            raise serializers.ValidationError("Upload session not found.")

    def validate(self, attrs):
        upload = attrs['upload_id']
        chunk_index = attrs['chunk_index']
        if chunk_index >= upload.total_chunks:
            raise serializers.ValidationError({"chunk_index": "Chunk index out of range."})
        if chunk_index in upload.uploaded_chunks:
            raise serializers.ValidationError({"chunk_index": "Chunk already uploaded."})
        return attrs
