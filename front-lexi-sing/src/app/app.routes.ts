import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
//supervisor
import { Supervisor} from './features/roles/supervisor/supervisor';
import { MonitoreoConversaciones } from './features/roles/supervisor/monitoreo-conversaciones/monitoreo-conversaciones';
import { Chat } from "./features/roles/supervisor/chat/chat";
import { Reportes} from './features/roles/supervisor/reportes/reportes';
//empleados
import { Empleados } from './features/roles/empleados/empleados';
//admin
//usuario
import { Usuario } from './features/roles/usuario/usuario';

import { ConversationListComponent } from './features/chat/conversation-list/conversation-list.component';
import { ChatComponent } from './features/chat/chat/chat.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const APP_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  //supervisor
  { path: 'roles/supervisor', component: Supervisor },
  { path: 'supervisor/monitoreo-conversaciones', component: MonitoreoConversaciones },
  { path: 'supervisor/chat', component: Chat },
  { path: 'supervisor/reportes', component: Reportes },
    { path: 'supervisor/conversations', component: ConversationListComponent },
  //empleados
  { path: 'roles/empleados', component: Empleados },
  { path: 'empleados/conversations', component: ConversationListComponent },
  //admin
  //usuario
  { path: 'roles/usuario', component: Usuario },

  { path: 'conversations', component: ConversationListComponent },

  { path: 'chat/:id', component: ChatComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];


