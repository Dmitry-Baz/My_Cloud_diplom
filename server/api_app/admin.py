from django.contrib import admin
from .models import User, Storage

class UserAdmin(admin.ModelAdmin):
    list_display = ('id_user', 'username', 'fullname', 'email', 'role')
    list_filter = ('role',)
    search_fields = ('email', 'username', 'fullname')

class StorageAdmin(admin.ModelAdmin):
    list_display = ('id_file', 'original_name', 'id_user', 'size', 'upload_date')
    list_filter = ('id_user', 'upload_date')
    search_fields = ('original_name', 'id_user__username')

admin.site.register(User, UserAdmin)
admin.site.register(Storage, StorageAdmin)

