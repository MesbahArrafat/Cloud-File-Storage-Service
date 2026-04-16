from celery import shared_task
import hashlib


@shared_task
def compute_file_hash(file_id):
    from files.models import File
    try:
        file_obj = File.objects.get(id=file_id)
        sha256 = hashlib.sha256()
        with file_obj.file.open('rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        file_obj.hash = sha256.hexdigest()
        file_obj.save(update_fields=['hash'])
        return file_obj.hash
    except File.DoesNotExist:
        return None


@shared_task
def log_activity(user_id, file_id, action, details=None):
    from files.models import ActivityLog
    ActivityLog.objects.create(
        user_id=user_id,
        file_id=file_id,
        action=action,
        details=details or {},
    )
