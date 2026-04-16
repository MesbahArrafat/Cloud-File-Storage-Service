from rest_framework import serializers
from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True, allow_null=True)
    filename = serializers.CharField(source='file.filename', read_only=True, allow_null=True)

    class Meta:
        model = ActivityLog
        fields = ('id', 'user', 'user_email', 'file', 'filename', 'action', 'timestamp', 'ip_address', 'extra_data')
        read_only_fields = fields
