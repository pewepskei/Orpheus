from rooms.models import SongQueue
from rooms.serializers import SongQueueSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

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
