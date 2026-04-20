import re
from rest_framework import serializers
from .models import CustomUser, Storage

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id_user', 'username', 'email', 'password', 'role')
        extra_kwargs = {'password': {'write_only': True}}

    def validate_username(self, value):
        if not re.match(r'^[a-zA-Z][a-zA-Z0-9]{3,19}$', value):
            raise serializers.ValidationError(
                "Логин должен начинаться с буквы, содержать только латинские буквы и цифры, и быть длиной от 4 до 20 символов."
            )
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Пользователь с таким именем уже существует.")
        return value

    def validate_email(self, value):
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, value):
            raise serializers.ValidationError("Неверный формат email.")
        
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует.")
        return value

    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Пароль должен содержать минимум 6 символов.")
        
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Пароль должен содержать хотя бы одну заглавную букву.")
        
        if not re.search(r'\d', value):
            raise serializers.ValidationError("Пароль должен содержать хотя бы одну цифру.")
        
        if not re.search(r'[@$!%*?&]', value):
            raise serializers.ValidationError("Пароль должен содержать хотя бы один специальный символ (@$!%*?&).")
            
        return value

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user