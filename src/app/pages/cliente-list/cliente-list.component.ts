import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../../services/cliente.service';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [CommonModule],   // <-- ¡ESTO ES OBLIGATORIO!
  templateUrl: './cliente-list.component.html',
  styleUrls: ['./cliente-list.component.css'],
})
export class ClienteListComponent implements OnInit {
  clientes: Cliente[] = [];

  constructor(private clienteService: ClienteService) {}

  ngOnInit() {
    this.obtenerClientes();
  }

  obtenerClientes() {
    this.clienteService.getClientes().subscribe((data) => {
      this.clientes = data;
    });
  }

  eliminar(id: number) {
    this.clienteService.eliminarCliente(id).subscribe(() => {
      this.obtenerClientes();
    });
  }
}