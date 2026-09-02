import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const APP_ROUTES: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard, roleGuard(['supervisor'])] },
  //supervisor
  {
    path: 'roles/supervisor',
    loadComponent: () => import('./features/roles/supervisor/supervisor').then(m => m.Supervisor),
    canActivate: [authGuard, roleGuard(['supervisor'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/roles/supervisor/pages/dashboard/dashboard').then(m => m.SupervisorDashboardPageComponent) },
      { path: 'conversations', loadComponent: () => import('./features/chat/conversation-list/conversation-list.component').then(m => m.ConversationListComponent) },
      { path: 'usuarios', loadComponent: () => import('./features/roles/supervisor/usuarios_list/usuarios_list').then(m => m.SupervisorUsuariosList) },
      { path: 'monitoreo-conversaciones', loadComponent: () => import('./features/roles/supervisor/monitoreo-conversaciones/monitoreo-conversaciones').then(m => m.MonitoreoConversaciones) },
      { path: 'reportes', loadComponent: () => import('./features/roles/supervisor/reportes/reportes').then(m => m.Reportes) },
      { path: 'configuracion', loadComponent: () => import('./shared/components/configuracion-perfil/configuracion-perfil.component').then(m => m.ConfiguracionPerfilComponent) },
    ]
  },
  //empleados
  {
    path: 'roles/empleados',
    loadComponent: () => import('./features/roles/empleados/empleados').then(m => m.Empleados),
    canActivate: [authGuard, roleGuard(['empleado'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/roles/empleados/pages/dashboard/dashboard').then(m => m.EmpleadosDashboardPageComponent) },
      { path: 'conversations', loadComponent: () => import('./features/chat/conversation-list/conversation-list.component').then(m => m.ConversationListComponent) },
      { path: 'configuracion', loadComponent: () => import('./shared/components/configuracion-perfil/configuracion-perfil.component').then(m => m.ConfiguracionPerfilComponent) },
    ]
  },
  //admin
  {
    path: 'roles/admin',
    loadComponent: () => import('./features/roles/admin/admin').then(m => m.Admin),
    canActivate: [authGuard, roleGuard(['admin'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/roles/admin/pages/dashboard/admin-dashboard-page.component').then(m => m.AdminDashboardPageComponent) },
      { path: 'usuarios', loadComponent: () => import('./features/roles/admin/pages/usuarios/admin-usuarios-page.component').then(m => m.AdminUsuariosPageComponent) },
      { path: 'solicitudes', loadComponent: () => import('./features/roles/admin/pages/solicitudes/admin-solicitudes-page.component').then(m => m.AdminSolicitudesPageComponent) },
      { path: 'conversations', loadComponent: () => import('./features/chat/conversation-list/conversation-list.component').then(m => m.ConversationListComponent) },
      { path: 'configuracion', loadComponent: () => import('./shared/components/configuracion-perfil/configuracion-perfil.component').then(m => m.ConfiguracionPerfilComponent) },
      { path: 'reportes', loadComponent: () => import('./features/roles/admin/pages/reportes/admin-reportes-page.component').then(m => m.AdminReportesPageComponent) },
    ]
  },
  { path: 'admin/dashboard', redirectTo: '/roles/admin/dashboard', pathMatch: 'full' },
  { path: 'admin/usuarios', redirectTo: '/roles/admin/usuarios', pathMatch: 'full' },
  { path: 'admin/solicitudes', redirectTo: '/roles/admin/solicitudes', pathMatch: 'full' },
  { path: 'admin/configuracion', redirectTo: '/roles/admin/configuracion', pathMatch: 'full' },
  { path: 'admin/reportes', redirectTo: '/roles/admin/reportes', pathMatch: 'full' },
  { path: 'admin/chat', redirectTo: '/roles/admin/conversations', pathMatch: 'full' },
  //usuario
  { path: 'roles/usuario', loadComponent: () => import('./features/roles/usuario/usuario').then(m => m.Usuario), canActivate: [authGuard, roleGuard(['usuario'])] },
  //sordomudo
  {
    path: 'roles/sordomudo',
    loadComponent: () => import('./features/roles/sordomudo/sordomudo').then(m => m.Sordomudo),
    canActivate: [authGuard, roleGuard(['sordomudo'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/roles/sordomudo/pages/dashboard/dashboard').then(m => m.SordomudoDashboardPageComponent) },
      { path: 'conversations', loadComponent: () => import('./features/chat/conversation-list/conversation-list.component').then(m => m.ConversationListComponent) },
      { path: 'configuracion', loadComponent: () => import('./shared/components/configuracion-perfil/configuracion-perfil.component').then(m => m.ConfiguracionPerfilComponent) },
    ]
  },

  { path: 'conversations', loadComponent: () => import('./features/chat/conversation-list/conversation-list.component').then(m => m.ConversationListComponent), canActivate: [authGuard] },

  { path: 'chat/:id', loadComponent: () => import('./features/chat/chat/chat.component').then(m => m.ChatComponent), canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
