from django.contrib import admin
from .models import User, Storage

class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', 'full_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff')
    search_fields = ('username', 'email', 'full_name')

class StorageAdmin(admin.ModelAdmin):
    list_display = ('id', 'original_name', 'id_user', 'size', 'uploaded_at')
    list_filter = ('id_user', 'uploaded_at')
    search_fields = ('original_name', 'id_user__username')

admin.site.register(User, UserAdmin)
admin.site.register(Storage, StorageAdmin)

