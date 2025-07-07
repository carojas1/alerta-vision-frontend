import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class HomeComponent {
  fatigaLevel = 55;
  despiertoLevel = 30;
  somnolientoLevel = 80;

  constructor(private router: Router) {}

  ngOnInit() {
    setTimeout(() => this.fatigaLevel = 75, 900);
    setTimeout(() => this.despiertoLevel = 60, 1800);
    setTimeout(() => this.somnolientoLevel = 32, 2500);
  }

  goTo(ruta: string) {
    this.router.navigate([`/${ruta}`]);
  }
}
