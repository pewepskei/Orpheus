import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-name-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dialog-container">
      <h2>Edit Your Name</h2>

      <input [(ngModel)]="name" placeholder="Enter your name" class="name-input" />

      <div class="actions">
        <button class="save-btn" (click)="save()">Save</button>
        <button class="cancel-btn" (click)="close()">Cancel</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      background: #1e1a16;
      color: #f4e7d2;
      padding: 1.5rem;
      border-radius: 12px;
      width: 100%;
      max-width: 400px;
      box-sizing: border-box;
      font-family: 'Cormorant Garamond', serif;
    }

    h2 {
      margin-top: 0;
      font-size: 1.5rem;
      color: #f4e7d2;
    }

    .name-input {
      width: 100%;
      padding: 0.6rem;
      font-size: 1.1rem;
      border: 1px solid #c19e3f;
      border-radius: 8px;
      background-color: #2c251f;
      color: #f4e7d2;
      margin-top: 1rem;
      margin-bottom: 2rem;
    }

    .name-input::placeholder {
      color: #b8a683;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .save-btn, .cancel-btn {
      padding: 0.5rem 1.2rem;
      font-weight: bold;
      font-family: 'Cinzel', serif;
      font-size: 1rem;
      border-radius: 8px;
      border: none;
      cursor: pointer;
    }

    .save-btn {
      background-color: #c19e3f;
      color: #1e1a16;
    }

    .save-btn:hover {
      background-color: #b39032;
    }

    .cancel-btn {
      background: transparent;
      color: #f4e7d2;
      border: 1px solid #c19e3f;
    }

    .cancel-btn:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  `]
})
export class EditNameDialog {
  name: string;

  dialogRef = inject(MatDialogRef<EditNameDialog>);
  data = inject(MAT_DIALOG_DATA);

  constructor() {
    this.name = this.data?.currentName || '';
  }

  save() {
    this.dialogRef.close(this.name.trim());
  }

  close() {
    this.dialogRef.close();
  }
}
