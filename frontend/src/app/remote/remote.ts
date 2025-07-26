import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ReserveDialog } from './add-song';
import { FormsModule } from '@angular/forms';
import { EditNameDialog } from './edit-name';
import { QueueService, QueuedSong } from '../services/queue.service';
import { YouTubeVideo } from '../services/youtube.service';
import { ActivatedRoute } from '@angular/router';
import { QueueSocketService } from '../services/queue-socket.service';
import {
  trigger,
  transition,
  style,
  animate,
} from '@angular/animations';

@Component({
  selector: 'app-remote',
  standalone: true,
  templateUrl: './remote.html',
  styleUrls: ['./remote.scss'],
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeScale', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' })),
      ]),
    ]),
  ],
})
export class Remote {
  queuedSongs: QueuedSong[] = [];
  selectedSongIndex: number | null = null;
  deviceName: string = '';
  roomCode: string = '';

  constructor(
    private dialog: MatDialog,
    private queueService: QueueService,
    private route: ActivatedRoute,
    private socketService: QueueSocketService,
  ) {}

  ngOnInit() {
    const savedName = localStorage.getItem('device_name');
    this.deviceName = savedName ? savedName : this.getPrettyDeviceName();

    this.route.paramMap.subscribe(params => {
      this.roomCode = params.get('code') || '';
      if (!this.roomCode) {
        console.warn('No roomCode in URL!');
        return;
      }

      this.loadQueue();

      this.socketService.connect(this.roomCode).subscribe((songs) => {
        this.queuedSongs = songs;
      });
    });
  }

  ngOnDestroy() {
    this.socketService.disconnect();
  }

  loadQueue() {
    this.queueService.getQueue(this.roomCode).subscribe(songs => {
      this.queuedSongs = songs;
    });
  }

  getPrettyDeviceName(): string {
    const ua = navigator.userAgent;

    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    if (/Android/.test(ua)) {
      const match = ua.match(/Android.*;\s([^)]+)/);
      if (match) return match[1].trim();
      return 'Android Device';
    }
    if (/Macintosh/.test(ua)) return 'Mac';
    if (/Windows/.test(ua)) return 'Windows PC';
    if (/Linux/.test(ua)) return 'Linux Machine';
    return 'Guest';
  }

  openReserveDialog() {
    this.dialog.open(ReserveDialog, {
      width: '90%',
      maxWidth: '500px',
      data: {
        onAddSong: (video: YouTubeVideo) => {
          this.addSongToQueue(video);
        }
      },
    });
  }

  editName() {
    this.dialog.open(EditNameDialog, {
      width: '300px',
      data: { currentName: this.deviceName },
    }).afterClosed().subscribe((newName: string | undefined) => {
      if (newName?.trim()) {
        this.deviceName = newName.trim();
        localStorage.setItem('device_name', this.deviceName);
      }
    });
  }

  addSongToQueue(video: YouTubeVideo) {
    const guestId = localStorage.getItem('guest_id')!;
    const song: QueuedSong = {
      title: video.title,
      video_id: video.videoId,
      thumbnail_url: video.thumbnail?.[0]?.url || '',
      formatted_duration: video.formatted_duration,
      singer: this.deviceName,
      room_code: this.roomCode,
      guest_id: guestId,
      url: video.url,
      hls_url: video.hls_url,
    };

    this.queueService.addToQueue(song).subscribe(() => {
      this.loadQueue();
    });
  }

  toggleSongActions(index: number) {
    this.selectedSongIndex = this.selectedSongIndex === index ? null : index;
  }

  skipSong(song: QueuedSong) {
    this.queueService.markAsPlayed(this.roomCode).subscribe({
      next: () => {
        this.selectedSongIndex = null;
      },
      error: (err) => {
        console.error('Failed to skip song', err);
      }
    });
    this.selectedSongIndex = null;
  }

  prioritizeSong(song: QueuedSong) {
    this.queueService.prioritizeSong(this.roomCode, song.id!).subscribe({
      next: () => {
        this.selectedSongIndex = null;
      },
      error: (err) => {
        console.error('Failed to prioritize song', err);
      }
    });
  }

  deleteSong(song: QueuedSong) {
    if (!song.id) {
      console.error('Cannot delete song: Missing song ID');
      return;
    }

    this.queueService.deleteSong(this.roomCode, String(song.id)).subscribe({
      next: () => {
        this.selectedSongIndex = null;
      },
      error: (err) => {
        console.error('Failed to delete song', err);
      }
    });
  }
}
