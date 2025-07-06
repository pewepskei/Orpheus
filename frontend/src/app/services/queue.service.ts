import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QueuedSong {
  id?: number;
  title: string;
  video_id: string;
  thumbnail_url: string;
  formatted_duration: string;
  singer: string;
  room_code?: string;
  guest_id?: string;
}

@Injectable({ providedIn: 'root' })
export class QueueService {
  private apiUrl = 'http://192.168.1.109:8000/api/queue/';

  constructor(private http: HttpClient) {}

  addToQueue(song: QueuedSong): Observable<QueuedSong> {
    return this.http.post<QueuedSong>(this.apiUrl, song);
  }

  getQueue(roomCode: string): Observable<QueuedSong[]> {
    return this.http.get<QueuedSong[]>(`${this.apiUrl}?room_code=${roomCode}`);
  }
}

