from drf_yasg.utils import swagger_auto_schema
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

import uuid

from .models import Room, RoomMember, SongMetadata, SongQueue, NowPlaying

from .serializers import (
    RoomSerializer, RoomMemberSerializer,
    SongMetadataSerializer, SongQueueSerializer, NowPlayingSerializer
)


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    def get_permissions(self):
        if self.action in ['create', 'get_room']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            guest_id = request.data.get('guest_id')
            if guest_id:
                try:
                    uuid.UUID(str(guest_id))
                except ValueError:
                    return Response(
                        {"error": "Guest ID provided is not valid."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return Response(
                    {"error": "Guest ID is required for guest users."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        # hls_url = f"https://your-hls-host.com/streams/{uuid.uuid4()}.m3u8"
        hls_url = "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8"
        if self.request.user.is_authenticated:
            serializer.save(host=self.request.user)
        else:
            guest_id = self.request.data.get('guest_id')
            serializer.save(guest_id=guest_id, hls_stream_url=hls_url)

    @action(
        detail=True,
        methods=['POST'],
        url_name='join',
        url_path='join',
    )
    @swagger_auto_schema(
        operation_description="Join a room as a member",
        responses={200: RoomMemberSerializer()}
    )
    def join(self, request, pk=None):
        room = self.get_object()
        user = request.user
        member, _ = RoomMember.objects.get_or_create(user=user, room=room)
        serializer = RoomMemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=['GET'],
        url_path='get-room',
        url_name='get-room',
    )
    @swagger_auto_schema(
        operation_description="Get room details by room code",
        responses={200: RoomSerializer()}
    )
    def get_room(self, request, pk=None):
        # treat `pk` as `code` instead of the primary key
        code = pk
        room = get_object_or_404(Room, code=code)
        serializer = RoomSerializer(room)
        return Response(serializer.data, status=status.HTTP_200_OK)

class RoomMemberViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RoomMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RoomMember.objects.filter(user=self.request.user)

class SongMetadataViewSet(viewsets.ModelViewSet):
    queryset = SongMetadata.objects.all()
    serializer_class = SongMetadataSerializer
    permission_classes = [permissions.IsAuthenticated]  # Adjust if needed

class SongQueueViewSet(viewsets.ModelViewSet):
    serializer_class = SongQueueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get('room')
        if room_id:
            return SongQueue.objects.filter(room_id=room_id).order_by('position')
        return SongQueue.objects.none()

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)

class NowPlayingViewSet(viewsets.ModelViewSet):
    serializer_class = NowPlayingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get('room')
        if room_id:
            return NowPlaying.objects.filter(room_id=room_id)
        return NowPlaying.objects.none()

    def perform_create(self, serializer):
        serializer.save()

