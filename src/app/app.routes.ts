import { AuditComponent } from './features/dashboard/audit/audit';
import { CatalogoComponent } from './features/dashboard/catalogo/catalogo';
import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { DashboardComponent } from './features/dashboard/dashboard';
import { OverviewComponent } from './features/dashboard/overview/overview';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: OverviewComponent },
      { path: 'auditoria', component: AuditComponent },
      { path: 'catalogo', component: CatalogoComponent },
      { path: 'usuarios', component: RegisterComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
