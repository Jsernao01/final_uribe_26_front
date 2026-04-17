import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { IAuthResponse, IRegisterPayload } from '../../../models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly themeService = inject(ThemeService);

  protected readonly hidePassword = signal(true);
  protected readonly hideConfirmPassword = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly themeLabel = computed(() =>
    this.themeService.theme() === 'dark' ? 'Modo noche' : 'Modo día'
  );

  protected readonly documentTypes = [
    { value: 'CEDULA', label: 'Cédula' },
    { value: 'TARGETA_IDENTIDAD', label: 'Tarjeta de identidad' }
  ];

  protected readonly accountTypes = [
    { value: 'DEBITO', label: 'Débito' },
    { value: 'CREDITO', label: 'Crédito' }
  ];

  protected readonly registerForm = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(7)]],
      documentType: ['CEDULA' as const, [Validators.required]],
      documentNumber: ['', [Validators.required, Validators.minLength(5)]],
      birthDate: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.minLength(6)]],
      bankName: ['', [Validators.required, Validators.minLength(2)]],
      bankAccount: ['', [Validators.required, Validators.minLength(5)]],
      bankAccountType: ['DEBITO' as const, [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: [RegisterComponent.passwordMatchValidator] }
  );

  protected togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update((value) => !value);
  }

  protected onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const {
      confirmPassword: _,
      ...payload
    } = this.registerForm.getRawValue();

    this.authService.register(payload as IRegisterPayload).subscribe({
      next: (response: IAuthResponse) => {
        this.isLoading.set(false);
        this.snackBar.open(response.message, 'Cerrar', {
          duration: 3500,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/login']);
      },
      error: (error: IAuthResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
        this.snackBar.open(error.message, 'Cerrar', {
          duration: 3500,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private static passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value as string;
    const confirmPassword = control.get('confirmPassword')?.value as string;
    return password && confirmPassword && password !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  }
}
