import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { HlsPlayerComponent } from '../components/hls-player.component';
import { QRDialogComponent } from './qr-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { RoomService } from '../services/room.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatDialogModule, HlsPlayerComponent, MatIconModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private roomService = inject(RoomService);

  roomCode = '';
  hlsUrl = '';

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const room = nav?.extras.state?.['room'];

    this.roomCode = this.route.snapshot.paramMap.get('code') || '';

    if (this.roomCode) {
      this.roomService.getRoomByCode(this.roomCode).subscribe({
        next: (roomData) => {
          console.log('Fetched room:', roomData);
          this.hlsUrl = roomData.hls_stream_url;
          console.log("The url is", this.hlsUrl);
        },
        error: (err) => {
          console.error('Failed to fetch room:', err);
        }
      });
    }
  }

  openQRDialog(): void {
    const url = `${window.location.origin}/room/${this.roomCode}/remote`;
    this.dialog.open(QRDialogComponent, {
      data: { url }
    });
  }
}

