import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { API_ANALYTICS_BASE } from '../../../core/config/api.config';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <section class="catalogo-shell">
      <header class="page-header app-surface">
        <div class="header-info">
          <h2>Carga de Catálogo</h2>
          <p>Sube tus archivos Excel para registrar nuevas prendas en el sistema.</p>
        </div>
        <div class="header-actions">
           <input type="file" #fileInput (change)="onFileSelected($event)" accept=".xlsx" hidden>
           <button mat-flat-button color="primary" (click)="fileInput.click()" [disabled]="isUploading()">
              <mat-icon>upload_file</mat-icon>
              <span>{{ isUploading() ? 'Guardando...' : 'Seleccionar y Guardar Excel' }}</span>
            </button>
        </div>
      </header>

      <div class="app-surface" style="padding: 24px; border-radius: 20px;">
        <h3>Prendas Procesadas Recientemente</h3>
        @if (isUploading()) {
          <div style="text-align: center; padding: 40px;">
            <mat-spinner diameter="40" style="margin: 0 auto;"></mat-spinner>
            <p>Guardando prendas en la base de datos...</p>
          </div>
        } @else if (importResults().length > 0) {
          <div class="results-list">
            @for (item of importResults(); track $index) {
              <div class="result-row">
                <mat-icon [color]="item.estado === 'Guardado' ? 'primary' : 'warn'">
                  {{ item.estado === 'Guardado' ? 'check_circle' : 'error' }}
                </mat-icon>
                <div class="info">
                  <strong>{{ item.nombre }}</strong>
                  <span>{{ item.estado }}</span>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>cloud_upload</mat-icon>
            <p>Aún no has subido prendas en esta sesión.</p>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .catalogo-shell { display: flex; flex-direction: column; gap: 24px; }
    .page-header { padding: 24px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; }
    .results-list { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
    .result-row { display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--bg-soft); border-radius: 12px; border: 1px solid var(--stroke); }
    .result-row .info { display: flex; flex-direction: column; }
    .result-row .info span { font-size: 0.75rem; color: var(--text-muted); }
    .empty-state { text-align: center; padding: 60px; color: var(--text-muted); }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.3; }
  `]
})
export class CatalogoComponent {
  private readonly http = inject(HttpClient);
  protected readonly isUploading = signal(false);
  protected readonly importResults = signal<any[]>([]);

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  private uploadFile(file: File): void {
    this.isUploading.set(true);
    const formData = new FormData();
    formData.append('archivo', file);

    this.http.post<any>(`${API_ANALYTICS_BASE}/utilidades/subir-catalogo`, formData).subscribe({
      next: (res) => {
        this.importResults.set(res.detalles || []);
        this.isUploading.set(false);
      },
      error: (err) => {
        console.error('Error', err);
        this.isUploading.set(false);
      }
    });
  }
}
