from django.db import models
from django.conf import settings
import string, random
from django.contrib.auth import get_user_model
User = get_user_model()

def generate_room_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

class Room(models.Model):
    code = models.CharField(max_length=8, unique=True, default=generate_room_code)
    guest_id = models.UUIDField(null=True, blank=True)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100, blank=True)
    hls_stream_url = models.URLField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name or self.code}"

class RoomMember(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='members')
    joined_at = models.DateTimeField(auto_now_add=True)
    is_controller = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'room')

class SongMetadata(models.Model):
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    video_url = models.URLField(blank=True)  # optional
    duration = models.DurationField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.artist}"

class SongQueue(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),       # Not started
        ('composing', 'Composing'),   # In progress
        ('ready', 'Ready'),           # Done, has hls_url
        ('failed', 'Failed'),         # Optional
    ]

    title = models.CharField(max_length=255)
    video_id = models.CharField(max_length=100)
    thumbnail_url = models.URLField(blank=True, null=True)
    formatted_duration = models.CharField(max_length=20)
    singer = models.CharField(max_length=100)
    url = models.URLField(blank=True, null=True)
    hls_url = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    hls_url = models.TextField(blank=True, null=True)
    
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    added_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    guest_id = models.UUIDField(null=True, blank=True)

    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['position']
        unique_together = ('room', 'position')

class NowPlaying(models.Model):
    room = models.OneToOneField(Room, on_delete=models.CASCADE, related_name='now_playing')
    song = models.ForeignKey(SongMetadata, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
