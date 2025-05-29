from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    RoomViewSet,
    RoomMemberViewSet,
    SongMetadataViewSet,
    SongQueueViewSet,
    NowPlayingViewSet
)

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'members', RoomMemberViewSet, basename='member')
router.register(r'songs', SongMetadataViewSet, basename='song')
router.register(r'queue', SongQueueViewSet, basename='queue')
router.register(r'nowplaying', NowPlayingViewSet, basename='nowplaying')

urlpatterns = [
    path('', include(router.urls)),
]
