import { trigger, transition, style, animate, query, group } from '@angular/animations';

export const routeFadeAnimation = trigger('routeAnimations', [
  transition('* <=> *', [
    // optional: set position so the router-outlet can animate cleanly
    query(':enter, :leave', [
      style({ position: 'absolute', width: '100%' })
    ], { optional: true }),

    group([
      query(':leave', [
        animate('500ms ease-out', style({ opacity: 0 }))
      ], { optional: true }),
      query(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-in', style({ opacity: 1 }))
      ], { optional: true }),
    ])
  ])
]);

