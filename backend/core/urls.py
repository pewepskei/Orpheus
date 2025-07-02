from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import YoutubeViewSet

router = DefaultRouter()
router.register(r'youtube', YoutubeViewSet, basename='room')

urlpatterns = [
    path('', include(router.urls)),
]
