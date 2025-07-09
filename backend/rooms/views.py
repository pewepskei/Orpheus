from drf_yasg.utils import swagger_auto_schema
from django.shortcuts import get_object_or_404
from django.db import models
from django.conf import settings

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import SongQueue
from .serializers import SongQueueSerializer

from uuid import UUID

from .models import Room, RoomMember, SongMetadata, SongQueue, NowPlaying

from core.tasks import run_youtube_download_script

from celery import current_app

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
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            guest_id = request.data.get('guest_id')
            if guest_id:
                try:
                    UUID(str(guest_id))
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
        hls_url = f"{settings.CDN_URL}/video/index.m3u8"
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

    def get_permissions(self):
        if self.request.method in ['GET', 'POST']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        room_code = self.request.query_params.get('room_code')
        if room_code:
            return SongQueue.objects.filter(room__code=room_code).order_by('position')
        return SongQueue.objects.none()

    def perform_create(self, serializer):
        print("Broker at runtime:", current_app.conf.broker_url)
        guest_id = self.request.data.get("guest_id")
        user = self.request.user if self.request.user.is_authenticated else None
        video_url = self.request.data.get("url")
        video_id = self.request.data.get("video_id")

        room_code = self.request.data.get("room_code")
        if not room_code:
            raise serializers.ValidationError({"room_code": "Missing room_code."})

        try:
            room = Room.objects.get(code=room_code)
        except Room.DoesNotExist:
            raise serializers.ValidationError({"room_code": "Room does not exist."})

        last_position = SongQueue.objects.filter(room=room).aggregate(
                max_pos=models.Max('position')
                )['max_pos'] or 0

        hls_url = f"{settings.CDN_URL}/{video_id}/index.m3u8"

        instance = serializer.save(
                added_by=user,
                guest_id=guest_id,
                position=last_position + 1,
                url = video_url,
                hls_url=hls_url,
                )
        print(f"Phil instance is {instance.url}")
        run_youtube_download_script.delay(video_url, str(instance.id), video_id)
        broadcast_queue(room_code)

    @action(detail=False, methods=['POST'], url_path='mark-played')
    def mark_played(self, request):
        room_code = request.data.get('room_code')
        if not room_code:
            return Response({'error': 'Missing room_code'}, status=400)

        try:
            room = Room.objects.get(code=room_code)
        except Room.DoesNotExist:
            return Response({'error': 'Room does not exist'}, status=404)

        top_song = SongQueue.objects.filter(room=room).order_by('position').first()
        if top_song:
            top_song.delete()
            broadcast_queue(room_code)
            return Response({'status': 'ok', 'message': 'Top song removed'})
        else:
            return Response({'status': 'empty', 'message': 'No songs in queue'}, status=200)

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


def broadcast_queue(room_code: str):
    print(f"Phil the room_code is {room_code}")
    songs = SongQueue.objects.filter(room__code=room_code).order_by('created_at')
    serialized = SongQueueSerializer(songs, many=True).data

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'queue_{room_code}',
        {
            'type': 'send_queue_update',
            'data': serialized
        }
    )
