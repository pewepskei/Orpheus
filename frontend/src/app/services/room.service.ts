import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private apiUrl = `${environment.apiUrl}/rooms/`;

  constructor(private http: HttpClient) {}

  createRoom(guestId: string) {
    return this.http.post(this.apiUrl, { guest_id: guestId });
  }

  getRoomByCode(code: string): Observable<any> {
    const url = `${this.apiUrl}${code}/get-room/`;
    return this.http.get(url);
  }
}
