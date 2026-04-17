import hashlib
import io
import mimetypes
import os
import shutil
import zipfile

from django.core.files import File as DjangoFile
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from apps.activity.models import ActivityLog
from .models import File, FilePermission, ChunkUpload
from .permissions import IsFileOwnerOrPermitted
from .serializers import (FileSerializer, FileUploadSerializer, FileUpdateSerializer,
                           FilePermissionSerializer, ChunkUploadInitSerializer, ChunkSerializer)
from .tasks import log_activity
from .utils import find_duplicate_file


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


PREVIEWABLE_MIMES = {
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'image/bmp', 'image/svg+xml', 'application/pdf',
}


class FileViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(user=self.request.user)

    def list(self, request):
        queryset = self.get_queryset().filter(is_deleted=False)
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(filename__icontains=search)
        folder = request.query_params.get('folder')
        if folder == 'null' or folder == '':
            queryset = queryset.filter(folder=None)
        elif folder:
            queryset = queryset.filter(folder_id=folder)
        if request.query_params.get('starred', '').lower() == 'true':
            queryset = queryset.filter(is_starred=True)
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(FileSerializer(page, many=True, context={'request': request}).data)

    def create(self, request):
        serializer = FileUploadSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        file_obj = serializer.save()
        log_activity.delay(str(request.user.id), str(file_obj.id), ActivityLog.ACTION_UPLOAD, get_client_ip(request))
        return Response(FileSerializer(file_obj, context={'request': request}).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        file_obj = get_object_or_404(File, pk=pk)
        self._check_permission(request, file_obj)
        return Response(FileSerializer(file_obj, context={'request': request}).data)

    def partial_update(self, request, pk=None):
        file_obj = get_object_or_404(File, pk=pk, user=request.user)
        serializer = FileUpdateSerializer(file_obj, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if 'filename' in request.data:
            log_activity.delay(str(request.user.id), str(file_obj.id), ActivityLog.ACTION_RENAME, get_client_ip(request))
        return Response(FileSerializer(file_obj, context={'request': request}).data)

    def destroy(self, request, pk=None):
        file_obj = get_object_or_404(File, pk=pk, user=request.user)
        file_obj.is_deleted = True
        file_obj.save(update_fields=['is_deleted'])
        log_activity.delay(str(request.user.id), str(file_obj.id), ActivityLog.ACTION_DELETE, get_client_ip(request))
        return Response({'message': 'File moved to trash.'})

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        file_obj = get_object_or_404(File, pk=pk, user=request.user, is_deleted=True)
        file_obj.is_deleted = False
        file_obj.save(update_fields=['is_deleted'])
        log_activity.delay(str(request.user.id), str(file_obj.id), ActivityLog.ACTION_RESTORE, get_client_ip(request))
        return Response(FileSerializer(file_obj, context={'request': request}).data)

    @action(detail=True, methods=['delete'], url_path='permanent')
    def permanent_delete(self, request, pk=None):
        file_obj = get_object_or_404(File, pk=pk, user=request.user)
        file_size = file_obj.size
        file_obj.delete_file_from_storage()
        file_obj.delete()
        user = request.user
        user.storage_used = max(0, user.storage_used - file_size)
        user.save(update_fields=['storage_used'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def trash(self, request):
        queryset = self.get_queryset().filter(is_deleted=True)
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(FileSerializer(page, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def starred(self, request):
        queryset = self.get_queryset().filter(is_deleted=False, is_starred=True)
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(FileSerializer(page, many=True, context={'request': request}).data)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        file_obj = get_object_or_404(File, pk=pk)
        self._check_permission(request, file_obj)
        if not file_obj.file:
            raise Http404
        log_activity.delay(
            str(request.user.id) if request.user.is_authenticated else None,
            str(file_obj.id), ActivityLog.ACTION_DOWNLOAD, get_client_ip(request)
        )
        return FileResponse(file_obj.file.open('rb'),
                            content_type=file_obj.mime_type or 'application/octet-stream',
                            as_attachment=True, filename=file_obj.original_filename)

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        file_obj = get_object_or_404(File, pk=pk)
        self._check_permission(request, file_obj)
        if file_obj.mime_type not in PREVIEWABLE_MIMES:
            return Response({'error': f"Preview not supported for {file_obj.mime_type}"},
                            status=status.HTTP_400_BAD_REQUEST)
        if not file_obj.file:
            raise Http404
        return FileResponse(file_obj.file.open('rb'), content_type=file_obj.mime_type, as_attachment=False)

    @action(detail=False, methods=['post'], url_path='zip-download')
    def zip_download(self, request):
        file_ids = request.data.get('file_ids', [])
        if not file_ids:
            return Response({'error': 'file_ids is required.'}, status=status.HTTP_400_BAD_REQUEST)
        files = File.objects.filter(id__in=file_ids, user=request.user, is_deleted=False)
        if not files.exists():
            return Response({'error': 'No files found.'}, status=status.HTTP_404_NOT_FOUND)
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            for f_obj in files:
                if f_obj.file:
                    with f_obj.file.open('rb') as f:
                        zf.writestr(f_obj.original_filename, f.read())
        zip_buffer.seek(0)
        return FileResponse(zip_buffer, content_type='application/zip', as_attachment=True, filename='download.zip')

    def _check_permission(self, request, file_obj):
        perm = IsFileOwnerOrPermitted()
        if not perm.has_object_permission(request, None, file_obj):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No permission to access this file.")


class ShareTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, file_id):
        file_obj = get_object_or_404(File, id=file_id, user=request.user)
        file_obj.is_public = True
        file_obj.save(update_fields=['is_public'])
        log_activity.delay(str(request.user.id), str(file_obj.id), ActivityLog.ACTION_SHARE, get_client_ip(request))
        return Response({
            'share_token': str(file_obj.share_token),
            'share_url': request.build_absolute_uri(f'/share/{file_obj.share_token}/'),
            'is_public': file_obj.is_public,
        })


class PublicShareView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        file_obj = get_object_or_404(File, share_token=token, is_public=True, is_deleted=False)
        if request.query_params.get('action') == 'download':
            if not file_obj.file:
                raise Http404
            log_activity.delay(
                str(request.user.id) if request.user.is_authenticated else None,
                str(file_obj.id), ActivityLog.ACTION_DOWNLOAD, get_client_ip(request), {'via_share_link': True}
            )
            return FileResponse(file_obj.file.open('rb'),
                                content_type=file_obj.mime_type or 'application/octet-stream',
                                as_attachment=True, filename=file_obj.original_filename)
        return Response({
            'filename': file_obj.original_filename,
            'size': file_obj.size,
            'mime_type': file_obj.mime_type,
            'share_token': str(file_obj.share_token),
        })


class FilePermissionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, file_id):
        file_obj = get_object_or_404(File, id=file_id, user=request.user)
        return Response(FilePermissionSerializer(file_obj.permissions.all(), many=True).data)

    def post(self, request, file_id):
        file_obj = get_object_or_404(File, id=file_id, user=request.user)
        serializer = FilePermissionSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        perm = serializer.save(file=file_obj)
        return Response(FilePermissionSerializer(perm).data, status=status.HTTP_201_CREATED)


class ChunkUploadInitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChunkUploadInitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        chunk_upload = serializer.save(user=request.user)
        return Response(ChunkUploadInitSerializer(chunk_upload).data, status=status.HTTP_201_CREATED)


class ChunkUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = ChunkSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        upload = serializer.validated_data['upload_id']
        chunk_index = serializer.validated_data['chunk_index']
        chunk_data = serializer.validated_data['chunk']
        from django.conf import settings as django_settings
        chunk_dir = os.path.join(django_settings.MEDIA_ROOT, 'chunks', str(upload.upload_id))
        os.makedirs(chunk_dir, exist_ok=True)
        with open(os.path.join(chunk_dir, f'chunk_{chunk_index}'), 'wb') as f:
            for data in chunk_data.chunks():
                f.write(data)
        chunks = list(upload.uploaded_chunks)
        chunks.append(chunk_index)
        upload.uploaded_chunks = chunks
        upload.save(update_fields=['uploaded_chunks'])
        return Response({'upload_id': str(upload.upload_id), 'chunk_index': chunk_index,
                         'uploaded_chunks': len(upload.uploaded_chunks), 'total_chunks': upload.total_chunks})


class ChunkUploadCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.conf import settings as django_settings
        upload_id = request.data.get('upload_id')
        folder_id = request.data.get('folder', None)
        if not upload_id:
            return Response({'error': 'upload_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        upload = get_object_or_404(ChunkUpload, upload_id=upload_id, user=request.user)
        if len(upload.uploaded_chunks) < upload.total_chunks:
            return Response({'error': 'Not all chunks uploaded.',
                             'uploaded': len(upload.uploaded_chunks), 'total': upload.total_chunks},
                            status=status.HTTP_400_BAD_REQUEST)
        chunk_dir = os.path.join(django_settings.MEDIA_ROOT, 'chunks', str(upload.upload_id))
        assembled_path = os.path.join(chunk_dir, upload.filename)
        with open(assembled_path, 'wb') as outfile:
            for i in range(upload.total_chunks):
                chunk_path = os.path.join(chunk_dir, f'chunk_{i}')
                with open(chunk_path, 'rb') as cf:
                    outfile.write(cf.read())
                os.remove(chunk_path)
        mime_type, _ = mimetypes.guess_type(upload.filename)
        if not mime_type:
            mime_type = 'application/octet-stream'
        sha256 = hashlib.sha256()
        with open(assembled_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        file_hash = sha256.hexdigest()
        existing = find_duplicate_file(file_hash, request.user)
        if existing:
            shutil.rmtree(chunk_dir, ignore_errors=True)
            upload.delete()
            return Response(FileSerializer(existing, context={'request': request}).data)
        folder = None
        if folder_id:
            from apps.folders.models import Folder
            try:
                folder = Folder.objects.get(id=folder_id, user=request.user)
            except Folder.DoesNotExist:
                pass
        file_size = os.path.getsize(assembled_path)
        with open(assembled_path, 'rb') as f:
            file_obj = File.objects.create(
                file=DjangoFile(f, name=upload.filename),
                filename=upload.filename, original_filename=upload.filename,
                size=file_size, hash=file_hash, folder=folder,
                user=request.user, mime_type=mime_type,
            )
        user = request.user
        user.storage_used += file_size
        user.save(update_fields=['storage_used'])
        shutil.rmtree(chunk_dir, ignore_errors=True)
        upload.delete()
        log_activity.delay(str(request.user.id), str(file_obj.id), ActivityLog.ACTION_UPLOAD,
                           get_client_ip(request), {'via_chunk_upload': True})
        return Response(FileSerializer(file_obj, context={'request': request}).data, status=status.HTTP_201_CREATED)
