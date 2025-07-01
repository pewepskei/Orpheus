import { Component } from '@angular/core';
import { RoomService } from '../services/room.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [ RouterModule ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  guestId = '31dbbc13-e81d-438a-9000-24fd205abc6d';

  constructor(
    private roomService: RoomService,
    private router: Router
  ) {}

  onCreateRoom() {
    this.roomService.createRoom(this.guestId).subscribe({
      next: (room: any) => {
        console.log('Room created:', room);
        const code = room.code;
        if (code) {
          this.router.navigate(['/room', code]);
        } else {
          alert('Room created but no code returned.');
        }
      },
      error: (err) => {
        console.error('Failed to create room:', err);
        alert('Error creating room');
      }
    });
  }
}
