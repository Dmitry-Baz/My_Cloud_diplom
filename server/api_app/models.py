from django.db import models
from django.contrib.auth.models import AbstractUser
import os

class User(AbstractUser):
    """Расширенная модель пользователя с полем role"""
    role = models.CharField(max_length=50, default='user')  # 'admin' или 'user'
    full_name = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
    
    def __str__(self):
        return self.username
    
    @property
    def is_admin(self):
        return self.role == 'admin'


class Storage(models.Model):
    """Модель для хранения файлов"""
    id_user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id', related_name='files')
    file = models.FileField(upload_to='uploads/%Y/%m/%d/')
    original_name = models.CharField(max_length=255)
    name = models.CharField(max_length=255, blank=True, null=True)
    comment = models.TextField(blank=True, default='')
    size = models.BigIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    last_downloaded_at = models.DateTimeField(null=True, blank=True)
    token = models.CharField(max_length=255, blank=True, null=True)
    token_expiration = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'storage'
    
    def __str__(self):
        return self.original_name
    
    def delete(self, *args, **kwargs):
        if self.file and os.path.isfile(self.file.path):
            try:
                os.remove(self.file.path)
            except OSError:
                pass
        super().delete(*args, **kwargs)
