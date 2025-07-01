import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { routeFadeAnimation } from './animations/fade.animation';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  animations: [routeFadeAnimation],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'Orpheus';

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }
}
