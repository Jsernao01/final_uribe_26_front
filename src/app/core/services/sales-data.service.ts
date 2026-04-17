import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
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

  getDashboardSnapshot(): Observable<IDashboardSnapshot> {
    return forkJoin({
      analyticsHealth: this.getAnalyticsHealth(),
      users: this.getUsers(),
      products: this.getProducts(),
      analytics: this.getAnalytics(false)
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
            error: analytics.error ?? 'No fue posible cargar la analítica.'
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
                  ? 'Analítica lista. Se activó modo demostración porque no había ventas reales.'
                  : statuses[1]?.detail ?? 'Analítica lista.'
              )
            }) satisfies IDashboardSnapshot)
          );
        }

        return of({
          analytics: analytics.data,
          mode: 'real',
          users: users.data,
          products: products.data,
          statuses
        } satisfies IDashboardSnapshot);
      })
    );
  }

  private getUsers(): Observable<IResult<IUserPreview[]>> {
    return this.http
      .request<IUserPreview[]>('GET', `${API_BACKEND_BASE}/usuarios/listar`, {
        body: { nombres: '', apellidos: '', correo: '' }
      })
      .pipe(
        map((data) => ({ ok: true, data })),
        catchError((error) => of(this.wrapError<IUserPreview[]>(error, [])))
      );
  }

  private getProducts(): Observable<IResult<IProductPreview[]>> {
    return this.http
      .request<IProductPreview[]>('GET', `${API_BACKEND_BASE}/productos/buscar`, {
        body: {
          nombre: '',
          minPrecio: 0,
          maxPrecio: 0,
          categorias: [],
          descuento: 0,
          color: ''
        }
      })
      .pipe(
        map((data) => ({ ok: true, data })),
        catchError((error) => of(this.wrapError<IProductPreview[]>(error, [])))
      );
  }

  private getAnalytics(useDemoData: boolean): Observable<IResult<IAnalyticsResponse | null>> {
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
        label: 'Backend',
        healthy: backendHealthy,
        detail: backendHealthy
          ? `${users.data.length} usuarios y ${products.data.length} productos disponibles.`
          : users.error ?? products.error ?? 'El backend no respondió correctamente.'
      },
      {
        label: 'Analítica',
        healthy: analyticsHealth.ok,
        detail: analyticsHealth.ok
          ? 'API analítica disponible y escuchando correctamente.'
          : analyticsHealth.error ?? 'No fue posible verificar la API analítica.'
      }
    ];
  }

  private enhanceStatuses(statuses: IServiceStatus[], analyticsDetail: string): IServiceStatus[] {
    return statuses.map((status) =>
      status.label === 'Analítica'
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
      error: this.extractApiMessage(error, 'No fue posible completar la solicitud.')
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
