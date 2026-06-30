import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SupervisorDashboardComponent } from './features/dashboard/supervisor-dashboard/supervisor-dashboard.component';
import { MonitoreoConversacionesComponent } from './features/dashboard/supervisor-dashboard/monitoreo-conversaciones/monitoreo-conversaciones.component';
import { ReportesComponent } from './features/dashboard/supervisor-dashboard/reportes/reportes.component';
import { ConversationListComponent } from './features/chat/conversation-list/conversation-list.component';
import { ChatComponent } from './features/chat/chat/chat.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const APP_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'dashboard/supervisor', component: SupervisorDashboardComponent },
  { path: 'supervisor/monitoreo-conversaciones', component: MonitoreoConversacionesComponent },
  { path: 'supervisor/reportes', component: ReportesComponent },
  { path: 'conversations', component: ConversationListComponent, canActivate: [authGuard] },
  { path: 'supervisor/conversations', component: ConversationListComponent },
  { path: 'chat/:id', component: ChatComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];


