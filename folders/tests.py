from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Folder


class FolderTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='folderuser', password='TestPass123!')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')

    def test_create_folder(self):
        response = self.client.post('/api/folders/', {'name': 'TestFolder'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Folder.objects.filter(name='TestFolder', user=self.user).exists())

    def test_list_folders(self):
        Folder.objects.create(name='Folder1', user=self.user)
        response = self.client.get('/api/folders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_delete_folder(self):
        folder = Folder.objects.create(name='ToDelete', user=self.user)
        response = self.client.delete(f'/api/folders/{folder.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Folder.objects.filter(pk=folder.id).exists())
