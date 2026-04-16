import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    storage_used = models.BigIntegerField(default=0)
    storage_limit = models.BigIntegerField(default=10 * 1024 * 1024 * 1024)  # 10 GB
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email

    @property
    def storage_used_mb(self):
        return round(self.storage_used / (1024 * 1024), 2)

    @property
    def storage_limit_mb(self):
        return round(self.storage_limit / (1024 * 1024), 2)
