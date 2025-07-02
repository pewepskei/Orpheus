import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ReserveDialog } from './add-song';

@Component({
  selector: 'app-remote',
  standalone: true,
  templateUrl: './remote.html',
  styleUrls: ['./remote.scss'],
})
export class Remote {
  queuedSongs = [
    { title: 'Bohemian Rhapsody', singer: 'Queen' },
    { title: 'Someone Like You', singer: 'Adele' },
  ];

  constructor(private dialog: MatDialog) {}

  openReserveDialog() {
    this.dialog.open(ReserveDialog, {
    width: '90%',
    maxWidth: '500px',
  });
  }
}

