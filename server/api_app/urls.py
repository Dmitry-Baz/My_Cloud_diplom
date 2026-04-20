from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserView, StorageView

router = DefaultRouter()
router.register(r'users', UserView, basename='user')
router.register(r'storage', StorageView, basename='storage')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.authtoken')),
]