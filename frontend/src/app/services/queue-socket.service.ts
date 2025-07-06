import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable } from 'rxjs';
import { QueuedSong } from './queue.service';

@Injectable({ providedIn: 'root' })
export class QueueSocketService {
  private socket$: WebSocketSubject<any> | null = null;

  connect(roomCode: string): Observable<QueuedSong[]> {
    const url = `ws://192.168.1.109:8000/ws/queue/${roomCode}/`;

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
