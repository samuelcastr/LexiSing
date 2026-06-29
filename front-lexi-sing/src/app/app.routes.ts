import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SupervisorDashboardComponent } from './features/roles/supervisor/dashboard/supervisor-dashboard.component';
import { MonitoreoConversacionesComponent } from './features/roles/supervisor/monitoring/monitoreo-conversaciones.component';
import { ReportesComponent } from './features/roles/supervisor/reports/reportes.component';
import { ConversationListComponent } from './features/chat/conversation-list/conversation-list.component';
import { ChatComponent } from './features/chat/chat/chat.component';
import { AdminComponent } from './features/roles/admin/admin.component';
import { UsuarioComponent } from './features/roles/usuario/usuario.component';
import { EmpleadoComponent } from './features/roles/empleado/empleado.component';
import { SordomudoComponent } from './features/roles/sordomudo/sordomudo.component';
import { SordomudoDashboardComponent } from './features/roles/sordomudo/sordomudo-dashboard.component';
import { SordomudoChatComponent } from './features/roles/sordomudo/sordomudo-chat.component';
import { SupervisorComponent } from './features/roles/supervisor/supervisor.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const APP_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, roleGuard(['admin'])] },
  { path: 'supervisor', component: SupervisorComponent, canActivate: [authGuard, roleGuard(['supervisor'])] },
  { path: 'usuario', component: UsuarioComponent, canActivate: [authGuard, roleGuard(['usuario'])] },
  { path: 'empleado', component: EmpleadoComponent, canActivate: [authGuard, roleGuard(['empleado'])] },
  {
    path: 'sordomudo',
    children: [
      {
        path: 'chat',
        component: SordomudoChatComponent,
        canActivate: [authGuard, roleGuard(['sordomudo'])]
      },
      {
        path: '',
        component: SordomudoDashboardComponent,
        canActivate: [authGuard, roleGuard(['sordomudo'])],
        pathMatch: 'full'
      }
    ]
  },
  { path: 'dashboard/supervisor', component: SupervisorDashboardComponent, canActivate: [authGuard, roleGuard(['supervisor'])] },
  { path: 'supervisor/monitoreo-conversaciones', component: MonitoreoConversacionesComponent, canActivate: [authGuard, roleGuard(['supervisor'])] },
  { path: 'supervisor/reportes', component: ReportesComponent, canActivate: [authGuard, roleGuard(['supervisor'])] },
  { path: 'conversations', component: ConversationListComponent, canActivate: [authGuard] },
  { path: 'supervisor/conversations', component: ConversationListComponent, canActivate: [authGuard, roleGuard(['supervisor'])] },
  { path: 'chat/:id', component: ChatComponent, canActivate: [authGuard] },
  { path: 'sordomudos', redirectTo: '/sordomudo', pathMatch: 'full' },
  { path: 'sordomudos/chat', redirectTo: '/sordomudo/chat', pathMatch: 'full' },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];


