from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from django.utils import timezone
from .models import Storage, User
from .serializers import StorageSerializer, UserSerializer
import os
import uuid
from datetime import timedelta

class ShareView(viewsets.GenericViewSet):
    """ViewSet для обработки специальных ссылок (без аутентификации)"""
    permission_classes = []
    
    @action(detail=False, methods=['get'], url_path='(?P<token>[^/.]+)')
    def download_by_token(self, request, token=None):
        """Скачивание файла по специальной ссылке"""
        storage = get_object_or_404(Storage, token=token)
        
        if storage.token_expiration and storage.token_expiration < timezone.now():
            return Response(
                {"detail": "Ссылка истекла."},
                status=status.HTTP_410_GONE
            )
        
        storage.last_download_date = timezone.now()
        storage.save(update_fields=['last_download_date'])
        
        file_path = storage.file.path
        if os.path.exists(file_path):
            return FileResponse(
                open(file_path, 'rb'),
                as_attachment=True,
                filename=storage.original_name
            )
        
        return Response(
            {"detail": "Файл не найден."},
            status=status.HTTP_404_NOT_FOUND
        )


class StorageView(viewsets.ModelViewSet):
    serializer_class = StorageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        id_user_param = self.kwargs.get('id_user') or self.request.query_params.get('id_user')
        
        if user.role == 'admin':
            if id_user_param:
                return Storage.objects.filter(id_user_id=id_user_param)
            return Storage.objects.all()
        else:
            if id_user_param and int(id_user_param) != user.id_user:
                return Storage.objects.none()
            return Storage.objects.filter(id_user=user)

    def _check_access(self, request, id_user_from_url=None):
        user = request.user
        target_user_id = id_user_from_url or request.data.get('id_user') or request.query_params.get('id_user')
        
        if target_user_id:
            target_user_id = int(target_user_id)
            if user.role != 'admin' and user.id_user != target_user_id:
                return False
        return True

    def list(self, request, *args, **kwargs):
        id_user_param = request.query_params.get('id_user')
        
        if not self._check_access(request, id_user_param):
            return Response(
                {"detail": "Нет прав доступа к этому хранилищу."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if request.user.role != 'admin' and instance.id_user.id_user != request.user.id_user:
            return Response(
                {"detail": "Нет прав доступа к этому файлу."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        id_user_from_data = request.data.get('id_user')
        if id_user_from_data and request.user.role != 'admin':
            return Response(
                {"detail": "Вы можете загружать файлы только в свое хранилище."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if request.user.role != 'admin' and instance.id_user.id_user != request.user.id_user:
            return Response(
                {"detail": "Нет прав на изменение этого файла."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if request.user.role != 'admin' and instance.id_user.id_user != request.user.id_user:
            return Response(
                {"detail": "Нет прав на изменение этого файла."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if request.user.role != 'admin' and instance.id_user.id_user != request.user.id_user:
            return Response(
                {"detail": "Нет прав на удаление этого файла."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        self.perform_destroy(instance)
        
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        instance = self.get_object()
        
        if request.user.role != 'admin' and instance.id_user.id_user != request.user.id_user:
            return Response(
                {"detail": "Нет прав на скачивание этого файла."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance.last_download_date = timezone.now()
        instance.save(update_fields=['last_download_date'])
        
        file_path = instance.file.path
        if os.path.exists(file_path):
            return FileResponse(
                open(file_path, 'rb'),
                as_attachment=True,
                filename=instance.original_name
            )
        
        return Response(
            {"detail": "Файл не найден на сервере."},
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=True, methods=['post'])
    def generate_share_link(self, request, pk=None):
        instance = self.get_object()
        
        if request.user.role != 'admin' and instance.id_user.id_user != request.user.id_user:
            return Response(
                {"detail": "Нет прав на создание ссылки для этого файла."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        token = str(uuid.uuid4()).replace('-', '')
        expiration = timezone.now() + timedelta(days=7)
        
        instance.token = token
        instance.token_expiration = expiration
        instance.save(update_fields=['token', 'token_expiration'])
        
        share_link = f"/api/share/{token}/"
        
        return Response({"share_link": share_link, "token": token})


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            return User.objects.all()
        return User.objects.filter(id_user=self.request.user.id_user)
    
    def list(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response(
                {"detail": "Нет прав. Только администратор может просматривать список пользователей."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().list(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response(
                {"detail": "Нет прав. Только администратор может удалять пользователей."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        
        if user.id_user == request.user.id_user:
            return Response(
                {"detail": "Нельзя удалить самого себя."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)

