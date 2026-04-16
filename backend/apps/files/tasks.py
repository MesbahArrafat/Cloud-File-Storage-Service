import hashlib
import io
import logging
import zipfile

from celery import shared_task
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task(bind=True, max_retries=3)
def compute_file_hash(self, file_id):
    try:
        from apps.files.models import File
        file_obj = File.objects.get(id=file_id)
        sha256 = hashlib.sha256()
        with file_obj.file.open('rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        file_obj.hash = sha256.hexdigest()
        file_obj.save(update_fields=['hash'])
        return file_obj.hash
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def process_zip_download(self, file_ids, user_id):
    try:
        from apps.files.models import File
        files = File.objects.filter(id__in=file_ids, user_id=user_id, is_deleted=False)
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            for f_obj in files:
                with f_obj.file.open('rb') as f:
                    zf.writestr(f_obj.original_filename, f.read())
        return zip_buffer.getvalue()
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
def log_activity(self, user_id, file_id, action, ip_address, extra_data=None):
    try:
        from apps.activity.models import ActivityLog
        from apps.files.models import File
        file_obj = File.objects.filter(id=file_id).first()
        user = User.objects.filter(id=user_id).first() if user_id else None
        ActivityLog.objects.create(
            user=user, file=file_obj, action=action,
            ip_address=ip_address or None, extra_data=extra_data or {},
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True)
def handle_large_file(self, file_id):
    try:
        from apps.files.models import File
        file_obj = File.objects.get(id=file_id)
        logger.info(f"Processing large file: {file_obj.filename} ({file_obj.size} bytes)")
        return {'status': 'processed', 'file_id': str(file_id)}
    except Exception as exc:
        return {'status': 'error', 'file_id': str(file_id), 'error': str(exc)}
