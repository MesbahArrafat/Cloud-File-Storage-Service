import io
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from .models import File, ActivityLog


class FileTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='fileuser', password='TestPass123!')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')

    def _make_file(self, content=b'Hello World', name='test.txt'):
        return SimpleUploadedFile(name, content, content_type='text/plain')

    def test_upload_file(self):
        upload = self._make_file()
        response = self.client.post('/api/upload/', {'file': upload, 'filename': 'test.txt'}, format='multipart')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

    def test_list_files(self):
        response = self.client.get('/api/files/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_duplicate_detection(self):
        content = b'Unique content for duplicate test'
        upload1 = SimpleUploadedFile('file1.txt', content, content_type='text/plain')
        upload2 = SimpleUploadedFile('file2.txt', content, content_type='text/plain')
        r1 = self.client.post('/api/upload/', {'file': upload1, 'filename': 'file1.txt'}, format='multipart')
        r2 = self.client.post('/api/upload/', {'file': upload2, 'filename': 'file2.txt'}, format='multipart')
        self.assertIn(r1.status_code, [200, 201])
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        self.assertIn('Duplicate', r2.data.get('detail', ''))

    def test_soft_delete(self):
        upload = self._make_file(name='delete_me.txt')
        r = self.client.post('/api/upload/', {'file': upload, 'filename': 'delete_me.txt'}, format='multipart')
        file_id = r.data['id'] if 'id' in r.data else r.data.get('file', {}).get('id')
        if file_id:
            response = self.client.delete(f'/api/files/{file_id}/')
            self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
            self.assertTrue(File.objects.get(pk=file_id).is_deleted)

    def test_trash_restore(self):
        upload = self._make_file(content=b'Restore me', name='restore.txt')
        r = self.client.post('/api/upload/', {'file': upload, 'filename': 'restore.txt'}, format='multipart')
        file_id = r.data.get('id')
        if file_id:
            self.client.delete(f'/api/files/{file_id}/')
            r2 = self.client.post(f'/api/trash/{file_id}/restore/')
            self.assertEqual(r2.status_code, status.HTTP_200_OK)
            self.assertFalse(File.objects.get(pk=file_id).is_deleted)

    def test_star_toggle(self):
        upload = self._make_file(content=b'Star me', name='star.txt')
        r = self.client.post('/api/upload/', {'file': upload, 'filename': 'star.txt'}, format='multipart')
        file_id = r.data.get('id')
        if file_id:
            r2 = self.client.post(f'/api/files/{file_id}/star/')
            self.assertEqual(r2.status_code, status.HTTP_200_OK)
            self.assertTrue(r2.data['is_starred'])

    def test_search(self):
        upload = self._make_file(content=b'Searchable', name='uniquesearchname.txt')
        self.client.post('/api/upload/', {'file': upload, 'filename': 'uniquesearchname.txt'}, format='multipart')
        response = self.client.get('/api/search/?q=uniquesearch')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_zip_download(self):
        upload = self._make_file(content=b'Zip content', name='ziptest.txt')
        r = self.client.post('/api/upload/', {'file': upload, 'filename': 'ziptest.txt'}, format='multipart')
        file_id = r.data.get('id')
        if file_id:
            response = self.client.post('/api/files/zip/', {'file_ids': [file_id]}, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response['Content-Type'], 'application/zip')

    def test_share_link(self):
        upload = self._make_file(content=b'Share link test', name='shareable.txt')
        r = self.client.post('/api/upload/', {'file': upload, 'filename': 'shareable.txt'}, format='multipart')
        file_id = r.data.get('id')
        if file_id:
            r2 = self.client.post(f'/api/files/{file_id}/share/', {'is_public': True}, format='json')
            self.assertEqual(r2.status_code, status.HTTP_200_OK)
            self.assertIn('share_token', r2.data)

    def test_activity_log(self):
        response = self.client.get('/api/activity/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
