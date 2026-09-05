import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { User } from '../../../../../core/models/user.model';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './user-table.component.html',
  styleUrls: ['./user-table.component.scss']
})
export class UserTableComponent implements OnInit {
  @Input() users: User[] = [];
  @Input() availableRoles: string[] = ['usuario', 'empleado', 'supervisor', 'admin', 'sordomudo'];
  @Input() showPendingBadge: boolean = false;
  @Input() actionButtonLabel: string = 'Guardar';
  @Input() showActionForRole: string | null = null;

  @Output() roleChanged = new EventEmitter<{uid: string, currentRole: string, newRole: string}>();

  selectedRoles: { [uid: string]: string | undefined } = {};
  displayedColumns: string[] = [];

  private readonly ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    empleado: 'Empleado',
    usuario: 'Usuario',
    sordomudo: 'Sordomudo',
  };

  ngOnInit(): void {
    this.displayedColumns = this.showPendingBadge
      ? ['nombre', 'email', 'rol', 'nuevoRol', 'accion']
      : ['nombre', 'email', 'rol', 'accion'];
  }

  currentRole(user: User): string {
    return user.rol || 'usuario';
  }

  getCurrentRoleLabel(user: User): string {
    return this.ROLE_LABELS[user.rol] || (user.rol || 'Usuario');
  }

  getRoleLabel(role: string): string {
    return this.ROLE_LABELS[role] || role;
  }

  onRoleChange(uid: string, role: string): void {
    this.selectedRoles[uid] = role;
  }

  hasChanged(uid: string, currentRole: string): boolean {
    return this.selectedRoles[uid] !== undefined && this.selectedRoles[uid] !== currentRole;
  }

  cambiarRol(uid: string, currentRole: string): void {
    const newRole = this.selectedRoles[uid];
    if (!newRole || newRole === currentRole) return;
    this.roleChanged.emit({uid, currentRole, newRole});
    delete this.selectedRoles[uid];
  }

  shouldShowAction(user: User): boolean {
    if (!this.showActionForRole) return true;
    return user.rol === this.showActionForRole;
  }
}
