import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
//supervisor
import { Supervisor} from './features/roles/supervisor/supervisor';
import { SupervisorDashboardPageComponent } from './features/roles/supervisor/pages/dashboard/dashboard';
import { MonitoreoConversaciones } from './features/roles/supervisor/monitoreo-conversaciones/monitoreo-conversaciones';
import { Chat } from "./features/roles/supervisor/chat/chat";
import { Reportes} from './features/roles/supervisor/reportes/reportes';
import { SupervisorUsuariosList } from './features/roles/supervisor/usuarios_list/usuarios_list';
import { SupervisorConfiguracion } from './features/roles/supervisor/configuracion/configuracion';
//empleados
import { Empleados } from './features/roles/empleados/empleados';
import { EmpleadosDashboardPageComponent } from './features/roles/empleados/pages/dashboard/dashboard';
import { SupervisorConfiguracion as EmpleadoConfiguracion } from './features/roles/supervisor/configuracion/configuracion';
//sordomudo
import { Sordomudo } from './features/roles/sordomudo/sordomudo';
import { SordomudoDashboardPageComponent } from './features/roles/sordomudo/pages/dashboard/dashboard';
import { SordomudoConfiguracion } from './features/roles/sordomudo/configuracion/configuracion';
//admin
import { Admin } from './features/roles/admin/admin';
import { AdminDashboardPageComponent } from './features/roles/admin/pages/dashboard/admin-dashboard-page.component';
import { AdminUsuariosPageComponent } from './features/roles/admin/pages/usuarios/admin-usuarios-page.component';
import { AdminSolicitudesPageComponent } from './features/roles/admin/pages/solicitudes/admin-solicitudes-page.component';
import { AdminConfigPageComponent } from './features/roles/admin/pages/configuracion/admin-config-page.component';
import { AdminReportesPageComponent } from './features/roles/admin/pages/reportes/admin-reportes-page.component';
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
  {
    path: 'roles/supervisor',
    component: Supervisor,
    canActivate: [authGuard, roleGuard(['supervisor'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SupervisorDashboardPageComponent },
      { path: 'conversations', component: ConversationListComponent },
      { path: 'usuarios', component: SupervisorUsuariosList },
      { path: 'monitoreo-conversaciones', component: MonitoreoConversaciones },
      { path: 'reportes', component: Reportes },
      { path: 'configuracion', component: SupervisorConfiguracion },
    ]
  },
  //empleados
  {
    path: 'roles/empleados',
    component: Empleados,
    canActivate: [authGuard, roleGuard(['empleado'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: EmpleadosDashboardPageComponent },
      { path: 'conversations', component: ConversationListComponent },
      { path: 'configuracion', component: EmpleadoConfiguracion },
    ]
  },
  //admin
  {
    path: 'roles/admin',
    component: Admin,
    canActivate: [authGuard, roleGuard(['admin'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardPageComponent },
      { path: 'usuarios', component: AdminUsuariosPageComponent },
      { path: 'solicitudes', component: AdminSolicitudesPageComponent },
      { path: 'conversations', component: ConversationListComponent },
      { path: 'configuracion', component: AdminConfigPageComponent },
      { path: 'reportes', component: AdminReportesPageComponent },
    ]
  },
  { path: 'admin/dashboard', redirectTo: '/roles/admin/dashboard', pathMatch: 'full' },
  { path: 'admin/usuarios', redirectTo: '/roles/admin/usuarios', pathMatch: 'full' },
  { path: 'admin/solicitudes', redirectTo: '/roles/admin/solicitudes', pathMatch: 'full' },
  { path: 'admin/configuracion', redirectTo: '/roles/admin/configuracion', pathMatch: 'full' },
  { path: 'admin/reportes', redirectTo: '/roles/admin/reportes', pathMatch: 'full' },
  //usuario
  { path: 'roles/usuario', component: Usuario, canActivate: [authGuard, roleGuard(['usuario'])] },
  //sordomudo
  {
    path: 'roles/sordomudo',
    component: Sordomudo,
    canActivate: [authGuard, roleGuard(['sordomudo'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SordomudoDashboardPageComponent },
      { path: 'conversations', component: ConversationListComponent },
      { path: 'configuracion', component: SordomudoConfiguracion },
    ]
  },

  { path: 'conversations', component: ConversationListComponent, canActivate: [authGuard] },

  { path: 'chat/:id', component: ChatComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];


