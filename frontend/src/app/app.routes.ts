import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Dashboard } from './dashboard/dashboard';
import { JoinRoom } from './join-room/join-room';

export const routes: Routes = [
  { path: '', component: Home, data: { animation: 'Home' } },
  { path: 'join', component: JoinRoom, data: { animation: 'Join' } },
  { path: 'room/:code', component: Dashboard, data: { animation: 'Dashboard' } },
];
