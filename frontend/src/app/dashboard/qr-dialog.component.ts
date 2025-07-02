import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import QRCode from 'qrcode';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-qr-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="qr-dialog">
      <h2 mat-dialog-title>Scan to use Phone as Remote</h2>
      <div mat-dialog-content>
        <img [src]="qrDataUrl" alt="QR Code" class="qr-image" />
        <p class="qr-url">{{ data.url }}</p>
      </div>
    </div>
  `,
  styles: [`
    .qr-dialog {
      text-align: center;
      background-color: #241c15; /* solid dark brown */
      color: #fefae0;            /* light, not white */
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
      max-width: 90vw;
      margin: auto;
    }

    h2 {
      font-family: 'Cinzel', serif !important;
      color: white !important;
      font-size: 1.5rem !important;
      margin-bottom: 1.5rem;
    }

    .qr-image {
      width: 260px;
      height: 260px;
      margin-bottom: 1rem;
    }

    .qr-url {
      font-size: 0.95rem;
      word-break: break-word;
      background-color: #382c22; /* solid box for contrast */
      padding: 0.75rem;
      border-radius: 8px;
      font-family: monospace;
      color: #fff8e1;
    }
  `]
})
export class QRDialogComponent {
  qrDataUrl = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: { url: string }) {
    QRCode.toDataURL(data.url, { margin: 1 }).then(url => this.qrDataUrl = url);
  }
}

