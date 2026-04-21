from django.db import models
import os

class User(models.Model):
    """Модель пользователя"""
    id_user = models.AutoField(primary_key=True)
    email = models.EmailField(max_length=128, unique=True)
    username = models.CharField(max_length=128, unique=True)
    fullname = models.CharField(max_length=128)
    role = models.CharField(max_length=128, default='user')
    password_hash = models.CharField(max_length=128)
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return self.username
    
    @property
    def is_staff(self):
        """Проверка, является ли пользователь администратором"""
        return self.role == 'admin'
    
    @property
    def is_authenticated(self):
        return True
    
    def set_password(self, raw_password):
        """Установка пароля"""
        from django.contrib.auth.hashers import make_password
        self.password_hash = make_password(raw_password)
    
    def check_password(self, raw_password):
        """Проверка пароля"""
        from django.contrib.auth.hashers import check_password
        return check_password(raw_password, self.password_hash)


class Storage(models.Model):
    """Модель для хранения файлов"""
    id_file = models.AutoField(primary_key=True)
    id_user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id', related_name='storages')
    original_name = models.CharField(max_length=128)
    new_name = models.CharField(max_length=128, blank=True, null=True)
    comment = models.CharField(max_length=128, blank=True, default='')
    size = models.IntegerField()
    upload_date = models.DateTimeField(auto_now_add=True, db_column='uploaddate')
    last_download_date = models.DateTimeField(auto_now=True, db_column='lastdownloaddate', null=True)
    file = models.FileField(upload_to='uploads/')
    token = models.CharField(max_length=255, blank=True, null=True)
    token_expiration = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'storage'
    
    def __str__(self):
        return self.original_name
    
    def delete(self, *args, **kwargs):
        """При удалении записи удаляем файл с диска"""
        if self.file and hasattr(self.file, 'path') and os.path.isfile(self.file.path):
            try:
                os.remove(self.file.path)
            except OSError:
                pass
        super().delete(*args, **kwargs)
