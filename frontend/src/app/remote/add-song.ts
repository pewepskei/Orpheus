import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { YouTubeService, YouTubeVideo } from '../services/youtube.service';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, Subject } from 'rxjs';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-reserve-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule],
  template: `
    <div class="dialog-container">
      <h2>Reserve a Song</h2>
      <button mat-icon-button class="close-btn" (click)="dialogRef.close()" aria-label="Close">
        <mat-icon>close</mat-icon>
      </button>

      <div class="search-bar">
        <input
          [(ngModel)]="searchTerm"
          (ngModelChange)="onInputChange($event)"
          placeholder="Search YouTube"
          class="search-input"
        />

        <ul *ngIf="suggestions.length" class="suggestions-list">
          <li *ngFor="let s of suggestions" (click)="selectSuggestion(s)">
            {{ s }}
          </li>
        </ul>
        <button (click)="search()" class="search-btn"><mat-icon>search</mat-icon></button>

      </div>

      <div class="results">
        <div class="result" *ngFor="let video of results" (click)="addToQueue(video)">
          <img [src]="video.thumbnail[0].url || ''" class="thumb" alt="thumb" />
          <div class="info">
            <div class="title">{{ video.title }}</div>
            <div class="duration">{{ video.formatted_duration }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      position: relative;
      width: calc(100vw - 3rem);
      max-width: 500px;
      height: 80vh;
      margin: 0 auto;
      padding: 1rem;
      background: #1e1a16;
      color: #f4e7d2;
      border-radius: 12px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }

    h2 {
      margin-top: 0.25rem;
    }

    .close-btn {
      position: absolute;
      top: 1.2rem;
      right: 1.5rem;
      color: #f4e7d2;
      background: transparent;
      border: none;
      cursor: pointer;
      z-index: 10;
    }

    .search-bar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .search-input {
      flex: 1;
      padding: 0.5rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
    }

    .search-btn {
      padding: 0.5rem 1rem;
      background-color: #f4e7d2;
      color: #1a1a1a;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
    }

    .search-btn:hover {
      background-color: #e6dac5;
    }

    .results {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .result {
      flex: 1;                          // Take available vertical space
      overflow-y: auto;                // Make just this area scrollable
      display: flex;
      flex-direction: row;
      gap: 1rem;
      margin-top: 1rem;
    }

    .thumb {
      width: 90px;
      height: 60px;
      object-fit: cover;
      border-radius: 6px;
    }

    .info {
      flex: 1;
    }

    .title {
      font-weight: bold;
    }

    .duration {
      font-size: 0.9rem;
      opacity: 0.8;
    }
    .suggestions-list {
      position: absolute;
      top: 18%;
      left: 0;
      right: 0;
      background: #2a2a2a;
      border-radius: 6px;
      max-height: 350px;
      overflow-y: auto;
      z-index: 1000;
      list-style: none;
      margin: 0.25rem 0 0;
      padding: 0;

      li {
        padding: 0.5rem;
        border-bottom: 1px solid #444;
        cursor: pointer;

        &:hover {
          background: #3a3a3a;
        }
      }
    }
  `]
})
export class ReserveDialog {
  searchTerm = '';
  results: YouTubeVideo[] = [];
  suggestions: string[] = [];

  private searchSubject = new Subject<string>();
  private youtubeService = inject(YouTubeService);
  public dialogRef = inject(MatDialogRef<ReserveDialog>);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data:{ onAddSong: (video: YouTubeVideo) => void }
  ) {
    this.searchSubject.pipe(debounceTime(200)).subscribe((term) => {
      if (!term.trim()) {
        this.suggestions = [];
        return;
      }

      term = term + " karaoke";

      this.youtubeService.search(term).subscribe({
        next: (videos) => {
          this.suggestions = videos.slice(0, 5).map(v => v.title); // Top 5 only
        },
        error: (err) => console.error(err),
      });
    });
  }

  onInputChange(term: string) {
    this.searchSubject.next(term);
  }

  selectSuggestion(title: string) {
    this.searchTerm = title;
    this.suggestions = [];
    this.search();
  }

  search() {
    this.youtubeService.search(this.searchTerm).subscribe({
      next: (videos) => (this.results = videos),
      error: (err) => console.error('Search error:', err),
    });
  }

  addToQueue(video: YouTubeVideo) {
    console.log("Passing video to queue", video);
    this.data?.onAddSong?.(video);
    this.dialogRef.close();
  }
}
