import uuid
from django.db import models
from django.conf import settings


class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to='uploads/%Y/%m/%d/')
    filename = models.CharField(max_length=255)
    original_filename = models.CharField(max_length=255)
    size = models.BigIntegerField(default=0)
    hash = models.CharField(max_length=64, blank=True)
    folder = models.ForeignKey('folders.Folder', on_delete=models.SET_NULL, null=True, blank=True, related_name='files')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='files')
    is_public = models.BooleanField(default=False)
    share_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_deleted = models.BooleanField(default=False)
    is_starred = models.BooleanField(default=False)
    mime_type = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'files'
        ordering = ['-created_at']

    def __str__(self):
        return self.filename

    def delete_file_from_storage(self):
        if self.file:
            self.file.delete(save=False)


class FilePermission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='permissions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='file_permissions')
    can_view = models.BooleanField(default=True)
    can_download = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'file_permissions'
        unique_together = ('file', 'user')

    def __str__(self):
        return f"{self.user.email} -> {self.file.filename}"


class ChunkUpload(models.Model):
    upload_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    filename = models.CharField(max_length=255)
    total_chunks = models.IntegerField()
    uploaded_chunks = models.JSONField(default=list)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chunk_uploads')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chunk_uploads'
        ordering = ['-created_at']
