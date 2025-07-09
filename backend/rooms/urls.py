from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    RoomViewSet,
    SongQueueViewSet,
)

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'queue', SongQueueViewSet, basename='queue')

urlpatterns = [
    path('', include(router.urls)),
]
