import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private apiUrl = 'http://192.168.1.109:8000/api/rooms/';

  constructor(private http: HttpClient) {}

  createRoom(guestId: string) {
    return this.http.post(this.apiUrl, { guest_id: guestId });
  }

  getRoomByCode(code: string): Observable<any> {
    const url = `${this.apiUrl}${code}/get-room/`;
    return this.http.get(url);
  }
}
