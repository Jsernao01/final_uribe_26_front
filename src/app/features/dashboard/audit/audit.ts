import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { API_ANALYTICS_BASE } from '../../../core/config/api.config';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './audit.html',
  styleUrl: './audit.scss'
})
export class AuditComponent {
  private readonly http = inject(HttpClient);
  
  protected readonly dirtyData = signal<any[]>([]);
  protected readonly cleanData = signal<any[]>([]);
  protected readonly isCleaning = signal(false);

  generateAndClean(): void {
    this.isCleaning.set(true);
    this.dirtyData.set([]);
    this.cleanData.set([]);
    
    // 1. Obtenemos datos sucios
    this.http.get<any>(`${API_ANALYTICS_BASE}/utilidades/simular-inventario-sucio`).subscribe({
      next: (res) => {
        this.dirtyData.set(res.resultado);
        
        // 2. Inmediatamente ejecutamos la limpieza para mostrar el contraste
        this.http.post<any>(`${API_ANALYTICS_BASE}/utilidades/limpiar`, {
          registros: res.resultado
        }).subscribe({
          next: (cleanRes) => {
            this.cleanData.set(cleanRes.resultado);
            this.isCleaning.set(false);
          },
          error: () => this.isCleaning.set(false)
        });
      },
      error: () => this.isCleaning.set(false)
    });
  }
}
