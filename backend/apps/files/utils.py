import hashlib
from .models import File


def compute_sha256(file_like):
    sha256 = hashlib.sha256()
    for chunk in iter(lambda: file_like.read(8192), b''):
        sha256.update(chunk)
    file_like.seek(0)
    return sha256.hexdigest()


def find_duplicate_file(file_hash, user):
    return File.objects.filter(hash=file_hash, user=user, is_deleted=False).first()
