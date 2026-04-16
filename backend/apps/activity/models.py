import uuid
from django.db import models
from django.conf import settings


class ActivityLog(models.Model):
    ACTION_UPLOAD = 'upload'
    ACTION_DOWNLOAD = 'download'
    ACTION_DELETE = 'delete'
    ACTION_RESTORE = 'restore'
    ACTION_SHARE = 'share'
    ACTION_RENAME = 'rename'

    ACTION_CHOICES = [
        (ACTION_UPLOAD, 'Upload'),
        (ACTION_DOWNLOAD, 'Download'),
        (ACTION_DELETE, 'Delete'),
        (ACTION_RESTORE, 'Restore'),
        (ACTION_SHARE, 'Share'),
        (ACTION_RENAME, 'Rename'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    file = models.ForeignKey('files.File', on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    extra_data = models.JSONField(default=dict)

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user} {self.action} {self.file}"
