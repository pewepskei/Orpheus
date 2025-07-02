from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from yt_dlp import YoutubeDL

class YoutubeViewSet(ViewSet):
    @action(
        detail=False,  # no ID in URL
        methods=['post'],
        url_path='search',
        url_name='search'
    )
    def search(self, request):
        query = request.data.get('q', '').strip()
        if not query:
            return Response({'error': 'Missing "q" in body'}, status=status.HTTP_400_BAD_REQUEST)

        ydl_opts = {
            'quiet': True,
            'extract_flat': True,
            'skip_download': True,
            'dump_single_json': True,
        }

        try:
            with YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(f"ytsearch10:{query}", download=False)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        def format_duration(seconds):
            if not seconds:
                return None
            return f"{int(seconds) // 60}:{int(seconds) % 60:02d}"

        results = []
        for entry in info.get('entries', []):
            results.append({
                'title': entry.get('title'),
                'videoId': entry.get('id'),
                'thumbnail': entry.get('thumbnails'),
                'url': f"https://www.youtube.com/watch?v={entry.get('id')}",
                'duration': entry.get('duration'),
                'formatted_duration': format_duration(entry.get('duration')),
            })

        return Response(results)

