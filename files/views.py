import hashlib
import io
import os
import zipfile

from django.conf import settings
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.db.models import Q
from django.http import FileResponse, HttpResponse
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import File, FileShare, ActivityLog, ChunkUpload
from .permissions import IsFileOwner
from .serializers import (
    FileSerializer,
    FileUploadSerializer,
    FileShareSerializer,
    ActivityLogSerializer,
    ChunkUploadSerializer,
)


def _compute_hash(file_obj):
    sha256 = hashlib.sha256()
    file_obj.seek(0)
    for chunk in iter(lambda: file_obj.read(8192), b''):
        sha256.update(chunk)
    file_obj.seek(0)
    return sha256.hexdigest()


def _log_activity(user, file_obj, action, details=None):
    try:
        from .tasks import log_activity
        log_activity.delay(user.id, file_obj.id if file_obj else None, action, details or {})
    except Exception:
        ActivityLog.objects.create(
            user=user,
            file=file_obj,
            action=action,
            details=details or {},
        )


class FileListView(generics.ListAPIView):
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(user=self.request.user, is_deleted=False)


class FileUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = FileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data['file']
        file_size = uploaded_file.size

        if file_size > settings.MAX_UPLOAD_SIZE:
            raise ValidationError({'file': f'File size exceeds the 100MB limit.'})

        filename = serializer.validated_data.get('filename') or uploaded_file.name
        folder = serializer.validated_data.get('folder')
        is_public = serializer.validated_data.get('is_public', False)

        file_hash = _compute_hash(uploaded_file)

        existing = File.objects.filter(user=request.user, hash=file_hash, is_deleted=False).first()
        if existing:
            return Response(
                {'detail': 'Duplicate file detected.', 'file': FileSerializer(existing).data},
                status=status.HTTP_200_OK,
            )

        file_obj = File.objects.create(
            user=request.user,
            folder=folder,
            file=uploaded_file,
            filename=filename,
            size=file_size,
            hash=file_hash,
            is_public=is_public,
        )

        try:
            from .tasks import compute_file_hash
            compute_file_hash.delay(file_obj.id)
        except Exception:
            pass

        _log_activity(request.user, file_obj, 'upload', {'filename': filename})

        return Response(FileSerializer(file_obj).data, status=status.HTTP_201_CREATED)


class FileDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated, IsFileOwner]

    def get_queryset(self):
        return File.objects.filter(user=self.request.user, is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])
        _log_activity(self.request.user, instance, 'delete', {'filename': instance.filename})


class FileDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            file_obj = File.objects.get(pk=pk, is_deleted=False)
        except File.DoesNotExist:
            raise NotFound('File not found.')

        is_owner = file_obj.user == request.user
        is_shared = FileShare.objects.filter(file=file_obj, shared_with=request.user).exists()

        if not (is_owner or file_obj.is_public or is_shared):
            raise PermissionDenied('You do not have permission to download this file.')

        _log_activity(request.user, file_obj, 'download', {'filename': file_obj.filename})

        response = FileResponse(file_obj.file.open('rb'), as_attachment=True, filename=file_obj.filename)
        return response


class FileShareLinkView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsFileOwner]

    def post(self, request, pk):
        try:
            file_obj = File.objects.get(pk=pk, user=request.user, is_deleted=False)
        except File.DoesNotExist:
            raise NotFound('File not found.')

        is_public = request.data.get('is_public', True)
        file_obj.is_public = is_public
        file_obj.save(update_fields=['is_public'])

        _log_activity(request.user, file_obj, 'share', {'is_public': is_public})

        return Response({
            'share_token': str(file_obj.share_token),
            'is_public': file_obj.is_public,
            'share_url': f'/api/share/{file_obj.share_token}/',
        })


class ShareAccessView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        try:
            file_obj = File.objects.get(share_token=token, is_deleted=False)
        except File.DoesNotExist:
            raise NotFound('File not found.')

        if file_obj.is_public:
            return Response(FileSerializer(file_obj).data)

        if request.user.is_authenticated:
            is_owner = file_obj.user == request.user
            is_shared = FileShare.objects.filter(file=file_obj, shared_with=request.user).exists()
            if is_owner or is_shared:
                return Response(FileSerializer(file_obj).data)

        raise PermissionDenied('You do not have access to this file.')


class ZipDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file_ids = request.data.get('file_ids', [])
        if not file_ids:
            raise ValidationError({'file_ids': 'Please provide a list of file IDs.'})

        files = File.objects.filter(
            id__in=file_ids,
            is_deleted=False,
        ).filter(
            Q(user=request.user) |
            Q(is_public=True) |
            Q(shares__shared_with=request.user)
        ).distinct()

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            for f in files:
                with f.file.open('rb') as file_data:
                    zf.writestr(f.filename, file_data.read())

        buffer.seek(0)
        response = HttpResponse(buffer.read(), content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="download.zip"'
        return response


class TrashListView(generics.ListAPIView):
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(user=self.request.user, is_deleted=True)


class TrashRestoreView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            file_obj = File.objects.get(pk=pk, user=request.user, is_deleted=True)
        except File.DoesNotExist:
            raise NotFound('File not found in trash.')

        file_obj.is_deleted = False
        file_obj.save(update_fields=['is_deleted'])
        _log_activity(request.user, file_obj, 'restore', {'filename': file_obj.filename})

        return Response(FileSerializer(file_obj).data)


class StarredListView(generics.ListAPIView):
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(user=self.request.user, is_starred=True, is_deleted=False)


class StarToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            file_obj = File.objects.get(pk=pk, user=request.user, is_deleted=False)
        except File.DoesNotExist:
            raise NotFound('File not found.')

        file_obj.is_starred = not file_obj.is_starred
        file_obj.save(update_fields=['is_starred'])

        return Response({'is_starred': file_obj.is_starred})


class SearchView(generics.ListAPIView):
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        q = self.request.query_params.get('q', '')
        folder_id = self.request.query_params.get('folder')

        qs = File.objects.filter(
            user=self.request.user,
            is_deleted=False,
            filename__icontains=q,
        )

        if folder_id:
            qs = qs.filter(folder_id=folder_id)

        return qs


class PreviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            file_obj = File.objects.get(pk=pk, is_deleted=False)
        except File.DoesNotExist:
            raise NotFound('File not found.')

        is_owner = file_obj.user == request.user
        is_shared = FileShare.objects.filter(file=file_obj, shared_with=request.user).exists()

        if not (is_owner or file_obj.is_public or is_shared):
            raise PermissionDenied('You do not have permission to preview this file.')

        name = file_obj.filename.lower()
        if name.endswith('.pdf'):
            content_type = 'application/pdf'
        elif name.endswith('.png'):
            content_type = 'image/png'
        elif name.endswith('.gif'):
            content_type = 'image/gif'
        elif name.endswith(('.jpg', '.jpeg')):
            content_type = 'image/jpeg'
        elif name.endswith('.webp'):
            content_type = 'image/webp'
        else:
            raise ValidationError({'detail': 'Preview not supported for this file type.'})

        return FileResponse(file_obj.file.open('rb'), content_type=content_type)


class ChunkUploadInitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        filename = request.data.get('filename')
        total_chunks = request.data.get('total_chunks')
        folder_id = request.data.get('folder')

        if not filename or not total_chunks:
            raise ValidationError({'detail': 'filename and total_chunks are required.'})

        folder = None
        if folder_id:
            try:
                from folders.models import Folder
                folder = Folder.objects.get(pk=folder_id, user=request.user)
            except Exception:
                raise ValidationError({'folder': 'Invalid folder.'})

        chunk_upload = ChunkUpload.objects.create(
            user=request.user,
            filename=filename,
            total_chunks=int(total_chunks),
            folder=folder,
        )

        chunk_dir = settings.CHUNK_UPLOAD_DIR / str(chunk_upload.upload_id)
        chunk_dir.mkdir(parents=True, exist_ok=True)

        return Response(ChunkUploadSerializer(chunk_upload).data, status=status.HTTP_201_CREATED)


class ChunkUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, upload_id):
        try:
            chunk_upload = ChunkUpload.objects.get(upload_id=upload_id, user=request.user, completed=False)
        except ChunkUpload.DoesNotExist:
            raise NotFound('Upload session not found.')

        chunk_number = request.data.get('chunk_number')
        chunk_file = request.FILES.get('chunk')

        if chunk_number is None or not chunk_file:
            raise ValidationError({'detail': 'chunk_number and chunk are required.'})

        chunk_dir = settings.CHUNK_UPLOAD_DIR / str(upload_id)
        chunk_dir.mkdir(parents=True, exist_ok=True)
        chunk_path = chunk_dir / f'chunk_{int(chunk_number):06d}'

        with open(chunk_path, 'wb') as f:
            for data in chunk_file.chunks():
                f.write(data)

        chunk_upload.uploaded_chunks += 1
        chunk_upload.save(update_fields=['uploaded_chunks'])

        return Response({'uploaded_chunks': chunk_upload.uploaded_chunks})


class ChunkUploadCompleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, upload_id):
        try:
            chunk_upload = ChunkUpload.objects.get(upload_id=upload_id, user=request.user, completed=False)
        except ChunkUpload.DoesNotExist:
            raise NotFound('Upload session not found.')

        chunk_dir = settings.CHUNK_UPLOAD_DIR / str(upload_id)
        merged = io.BytesIO()

        for i in range(chunk_upload.total_chunks):
            chunk_path = chunk_dir / f'chunk_{i:06d}'
            if not chunk_path.exists():
                raise ValidationError({'detail': f'Chunk {i} is missing.'})
            with open(chunk_path, 'rb') as f:
                merged.write(f.read())

        merged.seek(0)
        total_size = merged.getbuffer().nbytes

        if total_size > settings.MAX_UPLOAD_SIZE:
            raise ValidationError({'detail': 'File size exceeds the 100MB limit.'})

        sha256 = hashlib.sha256()
        merged.seek(0)
        for chunk in iter(lambda: merged.read(8192), b''):
            sha256.update(chunk)
        file_hash = sha256.hexdigest()
        merged.seek(0)

        existing = File.objects.filter(user=request.user, hash=file_hash, is_deleted=False).first()
        if existing:
            chunk_upload.completed = True
            chunk_upload.save(update_fields=['completed'])
            _cleanup_chunks(chunk_dir)
            return Response(
                {'detail': 'Duplicate file detected.', 'file': FileSerializer(existing).data},
                status=status.HTTP_200_OK,
            )

        django_file = ContentFile(merged.read(), name=chunk_upload.filename)
        file_obj = File.objects.create(
            user=request.user,
            folder=chunk_upload.folder,
            file=django_file,
            filename=chunk_upload.filename,
            size=total_size,
            hash=file_hash,
        )

        chunk_upload.completed = True
        chunk_upload.save(update_fields=['completed'])
        _cleanup_chunks(chunk_dir)

        _log_activity(request.user, file_obj, 'upload', {'filename': file_obj.filename, 'chunked': True})

        return Response(FileSerializer(file_obj).data, status=status.HTTP_201_CREATED)


def _cleanup_chunks(chunk_dir):
    import shutil
    try:
        shutil.rmtree(chunk_dir)
    except Exception:
        pass


class FileShareWithUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            file_obj = File.objects.get(pk=pk, user=request.user, is_deleted=False)
        except File.DoesNotExist:
            raise NotFound('File not found.')

        username = request.data.get('username')
        if not username:
            raise ValidationError({'username': 'This field is required.'})

        try:
            target_user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise NotFound('User not found.')

        if target_user == request.user:
            raise ValidationError({'username': 'You cannot share a file with yourself.'})

        share, created = FileShare.objects.get_or_create(file=file_obj, shared_with=target_user)
        _log_activity(request.user, file_obj, 'share', {'shared_with': username})

        return Response(FileShareSerializer(share).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class ActivityLogView(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ActivityLog.objects.filter(user=self.request.user).order_by('-timestamp')
