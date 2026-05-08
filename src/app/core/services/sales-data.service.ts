import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { API_ANALYTICS_BASE, API_BACKEND_BASE } from '../config/api.config';
import {
  IAnalyticsResponse,
  IDashboardSnapshot,
  IProductPreview,
  IServiceStatus,
  IUserPreview
} from '../../models';

interface IResult<T> {
  ok: boolean;
  data: T;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class SalesDataService {
  private readonly http = inject(HttpClient);

  getDashboardSnapshot(forceDemo: boolean = false, sellerName: string = ""): Observable<IDashboardSnapshot> {
    return forkJoin({
      analyticsHealth: this.getAnalyticsHealth(),
      users: this.getUsers(),
      products: this.getProducts(),
      analytics: this.getAnalytics(forceDemo, sellerName)
    }).pipe(
      switchMap(({ analyticsHealth, users, products, analytics }) => {
        const statuses = this.buildStatuses(analyticsHealth, users, products);

        if (!analytics.ok || !analytics.data) {
          return of({
            analytics: null,
            mode: 'real',
            users: users.data,
            products: products.data,
            statuses,
            error: analytics.error ?? 'No se pudieron cargar los reportes.'
          } satisfies IDashboardSnapshot);
        }

        if (this.shouldUseDemoData(analytics.data)) {
          return this.getAnalytics(true).pipe(
            map((demoAnalytics) => ({
              analytics: demoAnalytics.ok && demoAnalytics.data ? demoAnalytics.data : analytics.data,
              mode: demoAnalytics.ok && demoAnalytics.data ? 'demo' : 'real',
              users: users.data,
              products: products.data,
              statuses: this.enhanceStatuses(
                statuses,
                demoAnalytics.ok && demoAnalytics.data
                  ? 'Se cargaron datos de ejemplo porque aún no hay ventas registradas.'
                  : statuses[1]?.detail ?? 'Reportes listos.'
              )
            }) satisfies IDashboardSnapshot)
          );
        }

        return of({
          analytics: analytics.data,
          mode: forceDemo ? 'demo' : 'real',
          users: users.data,
          products: products.data,
          statuses
        } satisfies IDashboardSnapshot);
      })
    );
  }

  exportToExcel(sellerName: string = "", useDemo: boolean = false): void {
    const filters = {
      filtros_usuarios: { nombres: '', apellidos: '', correo: '' },
      filtros_productos: {
        nombre: '',
        minPrecio: 0,
        maxPrecio: 0,
        categorias: [],
        descuento: 0,
        color: ''
      },
      filtros_vendedores: { nombre: sellerName },
      ventas: [],
      usar_datos_ejemplo: useDemo,
      ensuciar_resultado: false,
      limpiar_datos: true
    };

    this.http
      .post(`${API_ANALYTICS_BASE}/analisis/exportar/excel`, filters, {
        responseType: 'blob'
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'reporte_analitico.xlsx';
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => console.error('Error al exportar excel', error)
      });
  }

  private getUsers(): Observable<IResult<IUserPreview[]>> {
    return this.http
      .get<IUserPreview[]>(`${API_BACKEND_BASE}/usuarios/admin/listar`)
      .pipe(
        map((data) => ({ ok: true, data })),
        catchError((error) => of(this.wrapError<IUserPreview[]>(error, [])))
      );
  }

  private getProducts(): Observable<IResult<IProductPreview[]>> {
    return this.http
      .get<IProductPreview[]>(`${API_BACKEND_BASE}/productos/buscar`)
      .pipe(
        map((data) => ({ ok: true, data })),
        catchError((error) => of(this.wrapError<IProductPreview[]>(error, [])))
      );
  }

  private getAnalytics(useDemoData: boolean, sellerName: string = ""): Observable<IResult<IAnalyticsResponse | null>> {
    return this.http
      .post<IAnalyticsResponse>(`${API_ANALYTICS_BASE}/analisis/completo`, {
        filtros_usuarios: { nombres: '', apellidos: '', correo: '' },
        filtros_productos: {
          nombre: '',
          minPrecio: 0,
          maxPrecio: 0,
          categorias: [],
          descuento: 0,
          color: ''
        },
        filtros_vendedores: { nombre: sellerName },
      ventas: [],
        usar_datos_ejemplo: useDemoData,
        ensuciar_resultado: false,
        limpiar_datos: true
      })
      .pipe(
        map((data) => ({ ok: true, data })),
        catchError((error) => of(this.wrapError<IAnalyticsResponse | null>(error, null)))
      );
  }

  private getAnalyticsHealth(): Observable<IResult<{ estado: string } | null>> {
    return this.http.get<{ estado: string }>(`${API_ANALYTICS_BASE}/salud`).pipe(
      map((data) => ({ ok: true, data })),
      catchError((error) => of(this.wrapError<{ estado: string } | null>(error, null)))
    );
  }

  private buildStatuses(
    analyticsHealth: IResult<{ estado: string } | null>,
    users: IResult<IUserPreview[]>,
    products: IResult<IProductPreview[]>
  ): IServiceStatus[] {
    const backendHealthy = users.ok && products.ok;

    return [
      {
        label: 'Servidor',
        healthy: backendHealthy,
        detail: backendHealthy
          ? 'Conexión correcta, datos cargados.'
          : users.error ?? products.error ?? 'No se pudo conectar al servidor. Verifica que esté encendido.'
      },
      {
        label: 'Reportes',
        healthy: analyticsHealth.ok,
        detail: analyticsHealth.ok
          ? 'Módulo de reportes funcionando.'
          : analyticsHealth.error ?? 'No se pudo conectar al módulo de reportes.'
      }
    ];
  }

  private enhanceStatuses(statuses: IServiceStatus[], analyticsDetail: string): IServiceStatus[] {
    return statuses.map((status) =>
      status.label === 'Reportes'
        ? {
            ...status,
            detail: analyticsDetail
          }
        : status
    );
  }

  private shouldUseDemoData(data: IAnalyticsResponse): boolean {
    return (
      data.resumen.total_ventas === 0 &&
      data.mensajes.some((message) => message.toLowerCase().includes('no se encontraron ventas'))
    );
  }

  private wrapError<T>(error: unknown, fallbackData: T): IResult<T> {
    return {
      ok: false,
      data: fallbackData,
      error: this.extractApiMessage(error, 'Algo salió mal, intenta de nuevo.')
    };
  }

  private extractApiMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }

      if (error.error?.detail && typeof error.error.detail === 'string') {
        return error.error.detail;
      }

      if (error.message) {
        return error.message;
      }
    }

    return fallback;
  }
}
