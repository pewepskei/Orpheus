import subprocess
import logging
from celery import shared_task
from rooms.models import SongQueue 
from core.utils import broadcast_queue
from django.conf import settings

logger = logging.getLogger(__name__)

@shared_task
def run_youtube_download_script(youtube_url, import_uuid, video_id):
    logger.info(f"Starting YouTube download for: {youtube_url} (UUID: {import_uuid})")

    instance = SongQueue.objects.filter(id=import_uuid).first()
    if not instance:
        logger.error(f"No SongQueue instance found for ID {import_uuid}")
        return

    try:
        result = subprocess.run(
            ["python", "core/scripts/download_youtube_video.py", youtube_url, import_uuid, video_id],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        logger.info(f"[{youtube_url}] Download successful. Output: {result.stdout}")

        instance.status = 'ready'
        instance.hls_url = f"{settings.CDN_URL}/{video_id}/index.m3u8"
        instance.save()
        broadcast_queue(instance.room.code)

    except subprocess.CalledProcessError as e:
        logger.error(f"[{youtube_url}] Download failed. Error: {e.stderr}")
        instance.status = 'failed'
        instance.save()
        broadcast_queue(instance.room.code)

