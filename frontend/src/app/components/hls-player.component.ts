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
    <video #videoRef controls autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
  `,
})
export class HlsPlayerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() src: string = '';
  @Output() ended = new EventEmitter<void>();
  @Output() timeUpdate = new EventEmitter<{ currentTime: number; duration: number }>();
  @ViewChild('videoRef', { static: true }) videoElement!: ElementRef<HTMLVideoElement>;

  private hls: Hls | null = null;

  ngOnInit() {
    if (this.src) {
      this.waitForPlaylistAndSetup(this.src);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && !changes['src'].firstChange) {
      this.waitForPlaylistAndSetup(this.src);
    }
  }

  private async waitForPlaylistAndSetup(src: string, retries: number = 60, delayMs: number = 3000): Promise<void> {
    const pollUntilAvailable = (src: string, remaining: number): Promise<string> => {
      return new Promise((resolve, reject) => {
        const attempt = () => {
          fetch(src, { method: 'HEAD' })
            .then(res => {
              if (res.ok) {
                resolve(src);
              } else {
                throw new Error('Playlist not ready (non-200 response)');
              }
            })
            .catch(err => {
              if (remaining > 0) {
                setTimeout(() => {
                  pollUntilAvailable(src, remaining - 1).then(resolve).catch(reject);
                }, delayMs);
              } else {
                reject(new Error('Playlist failed to load after retries'));
              }
            });
        };
  
        attempt();
      });
    };
  
    try {
      const readySrc = await pollUntilAvailable(src, retries);
      console.log('[HLS] Playlist available, starting setup.');
      this.setupPlayer(readySrc);
    } catch (err) {
      console.error('[HLS] Playlist failed to load:', err);
    }
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

    video.removeEventListener('timeupdate', this.onTimeUpdate);
    video.addEventListener('timeupdate', this.onTimeUpdate);

    if (Hls.isSupported()) {
      this.hls = new Hls({
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        maxBufferHole: 1,
        liveSyncDuration: 5,
        liveMaxLatencyDuration: 30,
      });
      this.hls.attachMedia(video);

      this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        this.hls!.loadSource(src);

        this.hls!.on(Hls.Events.MANIFEST_PARSED, () => {
          video.muted = false;
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
    this.ended.emit();
  };

  private onTimeUpdate = () => {
    const video = this.videoElement.nativeElement;
    this.timeUpdate.emit({
      currentTime: video.currentTime,
      duration: video.duration
    });
  };

  ngOnDestroy() {
    const video = this.videoElement.nativeElement;
    this.hls?.destroy();
    this.videoElement.nativeElement.removeEventListener('ended', this.onEnded);
    video.removeEventListener('timeupdate', this.onTimeUpdate);
  }
}

