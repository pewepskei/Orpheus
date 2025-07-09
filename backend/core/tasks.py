import subprocess
import logging
from celery import shared_task

logger = logging.getLogger(__name__)

@shared_task
def run_youtube_download_script(youtube_url, import_uuid, video_id):
    logger.info(f"Starting YouTube download for: {youtube_url} (UUID: {import_uuid})")

    try:
        result = subprocess.run(
            ["python", "core/scripts/download_youtube_video.py", youtube_url, import_uuid, video_id],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        logger.info(f"[{youtube_url}] Download successful. Output: {result.stdout}")
    except subprocess.CalledProcessError as e:
        logger.error(f"[{youtube_url}] Download failed. Error: {e.stderr}")

