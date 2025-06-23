import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../models/cliente.model'; // Asegúrate de tener este modelo

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private API_URL = 'http://localhost:3000/clientes'; // Cambia si usas Railway

  // CORRECTO: usar español para coherencia en todo el código
  crearCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.API_URL, cliente);
  }

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.API_URL);
  }

  updateCliente(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.API_URL}/${id}`, cliente);
  }

  eliminarCliente(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  constructor(private http: HttpClient) {}
}