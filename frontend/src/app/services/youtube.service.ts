import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface YouTubeVideo {
  title: string;
  videoId: string;
  thumbnail: Array<{ url: string; height: number; width: number }>;
  url: string;
  hls_url: string;
  duration: number;
  formatted_duration: string;
}

@Injectable({ providedIn: 'root' })
export class YouTubeService {
  private apiUrl = `${environment.apiUrl}/youtube/search/`;

  constructor(private http: HttpClient) {}

  search(query: string): Observable<YouTubeVideo[]> {
    return this.http.post<YouTubeVideo[]>(this.apiUrl, { q: query.trim() });
  }
}

