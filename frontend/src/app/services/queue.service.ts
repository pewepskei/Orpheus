import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface QueuedSong {
  id?: number;
  title: string;
  video_id: string;
  thumbnail_url: string;
  url: string;
  hls_url: string;
  formatted_duration: string;
  singer: string;
  room_code?: string;
  guest_id?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class QueueService {
  private apiUrl = `${environment.apiUrl}/queue/`;

  constructor(private http: HttpClient) {}

  addToQueue(song: QueuedSong): Observable<QueuedSong> {
    return this.http.post<QueuedSong>(this.apiUrl, song);
  }

  getQueue(roomCode: string): Observable<QueuedSong[]> {
    return this.http.get<QueuedSong[]>(`${this.apiUrl}?room_code=${roomCode}`);
  }

  markAsPlayed(roomCode: string) {
    return this.http.post(`${this.apiUrl}mark-played/`, { room_code: roomCode });
  }

  deleteSong(roomCode: string, songId: string) {
    return this.http.post(`${this.apiUrl}delete-song/`, { room_code: roomCode, song_id: songId });
  }

  prioritizeSong(roomCode: string, songId: number) {
    return this.http.post(`${this.apiUrl}prioritize/`, { room_code: roomCode, song_id: songId });
  }
}

