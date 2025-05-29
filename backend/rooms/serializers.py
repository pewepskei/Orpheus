from rest_framework import serializers
from .models import Room, RoomMember, SongMetadata, SongQueue, NowPlaying

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'code', 'host', 'name', 'hls_stream_url', 'is_active', 'created_at']
        read_only_fields = ['hls_stream_url', 'id', 'code', 'created_at']

class RoomMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomMember
        fields = ['id', 'user', 'room', 'joined_at', 'is_controller']
        read_only_fields = ['id', 'joined_at']

class SongMetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SongMetadata
        fields = ['id', 'title', 'artist', 'video_url', 'duration']
        read_only_fields = ['id']

class SongQueueSerializer(serializers.ModelSerializer):
    song = SongMetadataSerializer(read_only=True)
    song_id = serializers.PrimaryKeyRelatedField(
        queryset=SongMetadata.objects.all(), source='song', write_only=True
    )
    added_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = SongQueue
        fields = ['id', 'room', 'song', 'song_id', 'position', 'added_by', 'is_played']
        read_only_fields = ['id', 'added_by']

class NowPlayingSerializer(serializers.ModelSerializer):
    song = SongMetadataSerializer(read_only=True)
    song_id = serializers.PrimaryKeyRelatedField(
        queryset=SongMetadata.objects.all(), source='song', write_only=True
    )
    room = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = NowPlaying
        fields = ['id', 'room', 'song', 'song_id', 'started_at']
        read_only_fields = ['id', 'started_at']

