import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { API_BACKEND_BASE } from '../config/api.config';
import { IAuthResponse, ILoginCredentials, IRegisterPayload, IUserSession } from '../../models';

interface IBackendLoginResponse {
  mensaje: string;
  token: string;
  usuario: {
    id: string;
    nombres: string;
    apellidos: string;
    correo: string;
    rol: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionStorageKey = 'ecocesde-session';
  private readonly tokenStorageKey = 'ecocesde-token';

  private readonly currentUserSignal = signal<IUserSession | null>(this.readStoredSession());
  private readonly tokenSignal = signal<string | null>(this.readStoredToken());

  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);
  readonly currentUser = computed(() => this.currentUserSignal());

  login(credentials: ILoginCredentials): Observable<IAuthResponse> {
    return this.http
      .post<IBackendLoginResponse>(`${API_BACKEND_BASE}/auth/login`, {
        correo: credentials.email.trim(),
        contrasena: credentials.password
      })
      .pipe(
        map((response) => ({
          success: true,
          message: response.mensaje,
          token: response.token,
          user: this.mapSessionUser(response.usuario)
        })),
        tap((response) => {
          if (response.user && response.token) {
            this.persistSession(response.user, response.token);
          }
        }),
        catchError((error) => this.toAuthError(error, 'Correo o contraseña incorrectos.'))
      );
  }

  adminCreateUser(payload: any, rol: string): Observable<IAuthResponse> {
    return this.http
      .post(`${API_BACKEND_BASE}/usuarios/admin/crear/${rol}`, {
        nombres: payload.firstName.trim(),
        apellidos: payload.lastName.trim(),
        tipoDocumento: payload.documentType,
        documento: payload.documentNumber.trim(),
        correo: payload.email.trim(),
        telefono: payload.phone.trim(),
        nacimiento: payload.birthDate,
        direccion: payload.address.trim(),
        contrasena: payload.password,
        cuentasBancarias: [
          {
            nombreBanco: payload.bankName?.trim() || 'Cuenta interna',
            cuenta: payload.bankAccount?.trim() || 'ACC-',
            tipoCuenta: payload.bankAccountType ?? 'DEBITO'
          }
        ]
      })
      .pipe(
        map(() => ({
          success: true,
          message: 'Usuario creado correctamente.'
        })),
        catchError((error) => this.toAuthError(error, 'No se pudo crear el usuario, intenta de nuevo.'))
      );
  }

  logout(): void {
    this.currentUserSignal.set(null);
    this.tokenSignal.set(null);
    localStorage.removeItem(this.sessionStorageKey);
    localStorage.removeItem(this.tokenStorageKey);
  }

  private mapSessionUser(user: IBackendLoginResponse['usuario']): IUserSession {
    return {
      id: user.id,
      firstName: user.nombres,
      lastName: user.apellidos,
      fullName: `${user.nombres ?? ''} ${user.apellidos ?? ''}`.trim(),
      email: user.correo,
      role: user.rol
    };
  }

  private persistSession(user: IUserSession, token: string): void {
    this.currentUserSignal.set(user);
    this.tokenSignal.set(token);
    localStorage.setItem(this.sessionStorageKey, JSON.stringify(user));
    localStorage.setItem(this.tokenStorageKey, token);
  }

  private readStoredSession(): IUserSession | null {
    const stored = localStorage.getItem(this.sessionStorageKey);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as IUserSession;
    } catch {
      localStorage.removeItem(this.sessionStorageKey);
      return null;
    }
  }

  private readStoredToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  private toAuthError(error: unknown, fallback: string): Observable<never> {
    return throwError(() => ({
      success: false,
      message: this.extractApiMessage(error, fallback)
    } satisfies IAuthResponse));
  }

  private extractApiMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }

      if (error.error && typeof error.error.message === 'string') {
        return error.error.message;
      }
    }

    return fallback;
  }
}
