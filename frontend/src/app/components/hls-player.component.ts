import {
  Component,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnInit,
  ViewChild,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
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
export class HlsPlayerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() src: string = '';
  @Output() ended = new EventEmitter<void>();
  @ViewChild('videoRef', { static: true }) videoElement!: ElementRef<HTMLVideoElement>;

  private hls: Hls | null = null;

  ngOnInit() {
    if (this.src) {
      this.waitForPlaylistAndSetup(this.src);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && !changes['src'].firstChange) {
      console.log('[HLS] src changed:', changes['src'].previousValue, '=>', changes['src'].currentValue);
      this.waitForPlaylistAndSetup(this.src);
    }
  }

  private waitForPlaylistAndSetup(src: string, retries: number = 5, delayMs: number = 1000) {
    const attempt = () => {
      fetch(src, { method: 'HEAD' })
        .then(res => {
          if (res.ok) {
            console.log('[HLS] Playlist available, starting setup.');
            this.setupPlayer(src);
          } else {
            throw new Error('Playlist not ready (non-200 response)');
          }
        })
        .catch(err => {
          if (retries > 0) {
            console.warn(`[HLS] Playlist not ready. Retrying... (${retries})`);
            setTimeout(() => this.waitForPlaylistAndSetup(src, retries - 1, delayMs), delayMs);
          } else {
            console.error('[HLS] Playlist failed to load after retries:', err);
          }
        });
    };

    attempt();
  }

  private setupPlayer(src: string) {
    const video = this.videoElement.nativeElement;

    // Clean up previous HLS instance
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    // Reset video element
    video.pause();
    video.removeAttribute('src');
    video.load();

    // Rebind event listener
    video.removeEventListener('ended', this.onEnded);
    video.addEventListener('ended', this.onEnded);

    if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.attachMedia(video);

      this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        this.hls!.loadSource(src);

        this.hls!.on(Hls.Events.MANIFEST_PARSED, () => {
          video.muted = true;
          video.play().then(() => {
            console.log('[HLS] Playback started');
          }).catch(err => {
            console.warn('[HLS] Playback error:', err);
          });
        });
      });

      this.hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('[HLS] Error:', data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('[HLS] Fatal network error. Attempting reload.');
              this.hls!.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[HLS] Fatal media error. Attempting recovery.');
              this.hls!.recoverMediaError();
              break;
            default:
              console.error('[HLS] Unrecoverable error. Destroying HLS.');
              this.hls!.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(err => {
          console.warn('[HLS] Native playback failed:', err);
        });
      });
    } else {
      console.warn('[HLS] Not supported in this browser');
    }
  }

  private onEnded = () => {
    console.log('[HLS] Video ended');
    this.ended.emit();
  };

  ngOnDestroy() {
    this.hls?.destroy();
    this.videoElement.nativeElement.removeEventListener('ended', this.onEnded);
  }
}

