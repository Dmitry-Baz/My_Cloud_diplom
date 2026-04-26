from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import User, Storage
import re

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'full_name', 'password', 'role')
        extra_kwargs = {'password': {'write_only': True}}
    
    def validate_username(self, value):
        if not re.match(r'^[a-zA-Z][a-zA-Z0-9]{3,19}$', value):
            raise serializers.ValidationError("Логин должен начинаться с буквы, содержать латинские буквы и цифры, длина 4-20 символов.")
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Пользователь с таким именем уже существует.")
        return value
    
    def validate_email(self, value):
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, value):
            raise serializers.ValidationError("Неверный формат email.")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует.")
        return value
    
    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Пароль должен быть не менее 6 символов.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Пароль должен содержать хотя бы одну заглавную букву.")
        if not re.search(r'\d', value):
            raise serializers.ValidationError("Пароль должен содержать хотя бы одну цифру.")
        if not re.search(r'[@$!%*?&]', value):
            raise serializers.ValidationError("Пароль должен содержать хотя бы один спецсимвол (@$!%*?&).")
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)  # ← теперь работает, потому что User наследует AbstractUser
        user.save()
        return user


class StorageSerializer(serializers.ModelSerializer):
    size_mb = serializers.SerializerMethodField()
    
    class Meta:
        model = Storage
        fields = ('id', 'original_name', 'name', 'comment', 'size', 'size_mb', 'uploaded_at', 'last_downloaded_at', 'file')
        read_only_fields = ('id', 'uploaded_at', 'size')
    
    def get_size_mb(self, obj):
        return round(obj.size / (1024 * 1024), 2) if obj.size else 0
