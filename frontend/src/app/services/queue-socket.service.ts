import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable, Subject, timer } from 'rxjs';
import { retryWhen, delayWhen, tap, takeUntil } from 'rxjs/operators';
import { QueuedSong } from './queue.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class QueueSocketService {
  private socket$: WebSocketSubject<any> | null = null;
  private destroy$ = new Subject<void>();
  private reconnectDelay = 3000;

  private connectSocket(roomCode: string): WebSocketSubject<any> {
    const url = `${environment.wbsUrl}/${roomCode}/`;

    return webSocket({
      url,
      deserializer: e => JSON.parse(e.data),
    });
  }

  connect(roomCode: string): Observable<QueuedSong[]> {
    return new Observable<QueuedSong[]>(observer => {
      const connectAndSubscribe = () => {
        this.socket$ = this.connectSocket(roomCode);

        this.socket$
          .pipe(
            takeUntil(this.destroy$),
            retryWhen(errors =>
              errors.pipe(
                tap(err => console.error('WebSocket error, retrying...', err)),
                delayWhen(() => timer(this.reconnectDelay))
              )
            )
          )
          .subscribe({
            next: msg => {
              if (msg.type === 'queue.update') {
                observer.next(msg.data);
              }
            },
            error: err => console.error('WebSocket fatal error:', err),
            complete: () => console.log('WebSocket completed'),
          });
      };

      connectAndSubscribe();
    });
  }

  disconnect() {
    this.destroy$.next();
    this.socket$?.complete();
    this.socket$ = null;
  }
}

