import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr-dialog',
  standalone: true,
  imports: [MatDialogModule],
  template: `
    <h2 mat-dialog-title>Scan to Join</h2>
    <div mat-dialog-content>
      <img [src]="qrDataUrl" alt="QR Code" />
      <p style="word-break: break-word;">{{ data.url }}</p>
    </div>
  `,
})
export class QRDialogComponent {
  qrDataUrl = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: { url: string }) {
    QRCode.toDataURL(data.url).then(url => this.qrDataUrl = url);
  }
}

