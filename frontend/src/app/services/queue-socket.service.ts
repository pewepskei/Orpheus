import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable } from 'rxjs';
import { QueuedSong } from './queue.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class QueueSocketService {
  private socket$: WebSocketSubject<any> | null = null;

  connect(roomCode: string): Observable<QueuedSong[]> {
    const url = `${environment.wbsUrl}/${roomCode}/`;

    this.socket$ = webSocket({
      url,
      deserializer: e => JSON.parse(e.data),
    });

    return new Observable<QueuedSong[]>(observer => {
      this.socket$!.subscribe({
        next: (msg) => {
          if (msg.type === 'queue.update') {
            observer.next(msg.data);
          }
        },
        error: (err) => console.error('WebSocket error', err),
        complete: () => console.log('WebSocket connection closed'),
      });
    });
  }

  disconnect() {
    this.socket$?.complete();
    this.socket$ = null;
  }
}
