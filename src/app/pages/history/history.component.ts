import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('listAnimation', [
      transition(':enter', [
        query('.alert-item', [
          style({ opacity: 0, transform: 'translateY(40px)' }),
          stagger(90, [
            animate('700ms cubic-bezier(.51,1.13,.61,.99)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('itemAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('500ms cubic-bezier(.51,1.13,.61,.99)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class HistoryComponent {
  alerts = [
    { message: 'Alerta de somnolencia', time: 'Hace 5 minutos' },
    { message: 'Alerta de somnolencia', time: 'Hace 10 minutos' },
    { message: 'Alerta de somnolencia', time: 'Hace 15 minutos' },
    { message: 'Alerta de somnolencia', time: 'Hace 20 minutos' }
  ];

  constructor(private router: Router) {}

  back() {
    this.router.navigate(['/home']);
  }

  goTo(ruta: string) {
    this.router.navigate([`/${ruta}`]);
  }
}
