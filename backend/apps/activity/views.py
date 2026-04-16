from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from .models import ActivityLog
from .serializers import ActivityLogSerializer


class ActivityLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logs = ActivityLog.objects.filter(user=request.user).select_related('file', 'user')
        paginator = PageNumberPagination()
        paginator.page_size = 50
        page = paginator.paginate_queryset(logs, request)
        return paginator.get_paginated_response(ActivityLogSerializer(page, many=True).data)
