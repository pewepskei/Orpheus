import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Hls from 'hls.js';

@Component({
  selector: 'app-hls-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <video #videoRef controls autoplay muted playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
  `,
})
export class HlsPlayerComponent implements OnInit, OnDestroy {
  @Input() src: string = '';
  @ViewChild('videoRef', { static: true }) videoElement!: ElementRef<HTMLVideoElement>;

  private hls: Hls | null = null;

  ngOnInit() {
    if (!this.src) {
      console.warn('[HLS] No source provided, skipping setup.');
      return;
    }

    const video = this.videoElement.nativeElement;
    video.muted = true; // Ensure video is muted
    video.autoplay = true;

    if (Hls.isSupported()) {
      this.hls = new Hls();

      this.hls.attachMedia(video);

      this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('[HLS] Media element attached');

        this.hls!.loadSource(this.src);

        this.hls!.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          console.log('[HLS] Manifest parsed, available quality levels:', data.levels);

          // Attempt to play
          video.play().then(() => {
            console.log('[HLS] Playback started');
          }).catch((err) => {
            console.warn('[HLS] Playback failed:', err);
          });
        });

        this.hls!.on(Hls.Events.ERROR, (_, data) => {
          console.error('[HLS ERROR]', data);
        });
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = this.src;
      video.addEventListener('loadedmetadata', () => {
        video.muted = true;
        video.play().catch((err) => {
          console.warn('[HLS] Native HLS playback failed:', err);
        });
      });
    } else {
      console.warn('[HLS] Not supported in this browser');
    }
  }

  ngOnDestroy() {
    this.hls?.destroy();
  }
}

