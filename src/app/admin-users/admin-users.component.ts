import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css'],
  imports: [CommonModule], // 👈 aquí se importa el CommonModule
})
export class AdminUsersComponent implements OnInit {
  usuarios: any[] = [];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.userService.getUsuarios().subscribe({
      next: (data) => (this.usuarios = data),
      error: (err) => console.error('Error cargando usuarios', err),
    });
  }

  eliminarUsuario(id: string) {
    this.userService.eliminarUsuario(id).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter((u) => String(u.id) !== id);
      },
      error: (err) => console.error('Error eliminando usuario', err),
    });
  }
}
