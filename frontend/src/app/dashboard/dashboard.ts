import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { HlsPlayerComponent } from '../components/hls-player.component';
import { QRDialogComponent } from './qr-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { RoomService } from '../services/room.service';
import { RouterModule } from '@angular/router';
import { QueueSocketService } from '../services/queue-socket.service';
import { QueueService, QueuedSong } from '../services/queue.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatDialogModule, HlsPlayerComponent, MatIconModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private queueService = inject(QueueService);
  private roomService = inject(RoomService);
  private queueSocket = inject(QueueSocketService);

  queuedSongs: QueuedSong[] = [];
  roomCode = '';
  hlsUrl = '';
  started = false;

  startKaraoke() {
    this.started = true;
    // autoplay is now allowed — the next time hlsUrl changes, video will play with audio
  }


  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const room = nav?.extras.state?.['room'];

    this.roomCode = this.route.snapshot.paramMap.get('code') || '';

    if (this.roomCode) {
      this.roomService.getRoomByCode(this.roomCode).subscribe({
        next: (roomData) => {
          console.log('Fetched room:', roomData);
          this.hlsUrl = roomData.hls_stream_url; // fallback / placeholder
          this.loadQueue(); // Initial fetch
        },
        error: (err) => {
          console.error('Failed to fetch room:', err);
        }
      });

      this.queueSocket.connect(this.roomCode).subscribe({
        next: (songs) => {
          const currentFirst = this.queuedSongs[0]?.hls_url;
          const newFirst = songs[0]?.hls_url;

          this.queuedSongs = songs;

          // Only update HLS if the top of the queue has changed
          if (newFirst && newFirst !== currentFirst) {
            console.log('New top of queue detected. Updating player:', newFirst);
            this.hlsUrl = newFirst;
          }
        },
        error: (err) => {
          console.error('WebSocket error:', err);
        }
      });
    }
  }

  ngOnDestroy(): void {
    console.log('Destroy detected');
    this.queueSocket.disconnect();
  }

  openQRDialog(): void {
    const url = `${window.location.origin}/room/${this.roomCode}/remote`;
    this.dialog.open(QRDialogComponent, {
      data: { url }
    });
  }

  loadQueue(): void {
    this.queueService.getQueue(this.roomCode).subscribe(songs => {
      this.queuedSongs = songs;

      if (songs.length > 0) {
        this.hlsUrl = songs[0].hls_url;
      }
    });
  }

  onVideoEnded(): void {
    console.log('Video ended, notifying backend');

    this.queueService.markAsPlayed(this.roomCode).subscribe({
      next: () => {
        console.log('Backend acknowledged. Waiting for WebSocket update...');
      },
      error: err => {
        console.error('Failed to notify backend:', err);
      }
    });
  }
}

