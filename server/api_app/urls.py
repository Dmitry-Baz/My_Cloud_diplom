from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, StorageView, ShareView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'storage', StorageView, basename='storage')
router.register(r'share', ShareView, basename='share')

urlpatterns = [
    path('', include(router.urls)),
]

