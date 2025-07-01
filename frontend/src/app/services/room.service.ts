import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private apiUrl = 'http://localhost:8000/api/rooms/';

  constructor(private http: HttpClient) {}

  createRoom(guestId: string) {
    return this.http.post(this.apiUrl, { guest_id: guestId });
  }
}
