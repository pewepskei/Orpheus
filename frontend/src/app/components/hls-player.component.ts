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
    const video = this.videoElement.nativeElement;

    if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(this.src);
      this.hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = this.src;
    }
  }

  ngOnDestroy() {
    this.hls?.destroy();
  }
}

