import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ClienteService } from '../../services/cliente.service';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  templateUrl: './cliente-form.component.html',
  styleUrls: ['./cliente-form.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class ClienteFormComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      sexo: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      edad: [{ value: 0, disabled: true }],
      cedula: ['', Validators.required],
    });
  }

  onFechaChange() {
    const fecha = new Date(this.form.value.fechaNacimiento);
    const edad = new Date().getFullYear() - fecha.getFullYear();
    this.form.patchValue({ edad });
  }

  onSubmit() {
    const data = this.form.getRawValue();
    this.clienteService.crearCliente(data).subscribe({
      next: () => {
        alert('Cliente registrado correctamente');
        this.form.reset();
      },
      error: () => {
        alert('Error al registrar cliente');
      }
    });
  }
}