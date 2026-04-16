from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class RegisterViewTest(APITestCase):
    def test_register_success(self):
        data = {'username': 'testuser', 'email': 'test@example.com', 'password': 'TestPass123!', 'password2': 'TestPass123!'}
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='testuser').exists())

    def test_register_password_mismatch(self):
        data = {'username': 'testuser', 'email': 'test@example.com', 'password': 'TestPass123!', 'password2': 'DifferentPass!'}
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        User.objects.create_user(username='loginuser', password='TestPass123!')
        data = {'username': 'loginuser', 'password': 'TestPass123!'}
        response = self.client.post('/api/auth/login/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
