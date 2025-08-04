import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class ProfileComponent implements OnInit {
  user: any = null;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    // Obtiene el nombre guardado en AuthService (al loguear o registrar)
    this.user = { nombre: this.auth.userName || 'Usuario' };
  }

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }
}
