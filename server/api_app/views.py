from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Storage, CustomUser
from .serializers import StorageSerializer, UserSerializer
import os

class StorageView(viewsets.ModelViewSet):
    serializer_class = StorageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        id_user_param = self.kwargs.get('id_user') or self.request.query_params.get('id_user')
        
        if user.is_staff:
            if id_user_param:
                return Storage.objects.filter(id_user_id=id_user_param)
            return Storage.objects.all()
        else:
            return Storage.objects.filter(id_user=user)

    def perform_create(self, serializer):
        serializer.save(id_user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not request.user.is_staff and instance.id_user != request.user:
            return Response({"detail": "Нет прав доступа к этому файлу."}, status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not request.user.is_staff and instance.id_user != request.user:
            return Response({"detail": "Нет прав на изменение этого файла."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not request.user.is_staff and instance.id_user != request.user:
            return Response({"detail": "Нет прав на изменение этого файла."}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if not request.user.is_staff and instance.id_user != request.user:
            return Response({"detail": "Нет прав на удаление этого файла."}, status=status.HTTP_403_FORBIDDEN)
        
        file_path = instance.file.path
        self.perform_destroy(instance)
        
        if os.path.isfile(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
                
        return Response(status=status.HTTP_204_NO_CONTENT)