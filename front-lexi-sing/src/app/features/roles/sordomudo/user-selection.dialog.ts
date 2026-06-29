import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-selection-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatListModule, MatIconModule],
  template: `
    <div mat-dialog-title>
      <h2>Selecciona un usuario para iniciar chat</h2>
    </div>
    <div mat-dialog-content>
      <mat-list>
        <mat-list-item *ngFor="let user of data.users" (click)="selectUser(user)" class="user-item">
          <mat-icon matListItemIcon>person</mat-icon>
          <div matListItemTitle>{{ user.nombre || user.email || 'Usuario' }}</div>
          <div matListItemLine>{{ user.email }}</div>
        </mat-list-item>
      </mat-list>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
    </div>
  `,
  styles: [`
    .user-item {
      cursor: pointer;
      &:hover {
        background-color: rgba(124, 58, 237, 0.08);
      }
    }
  `]
})
export class UserSelectionDialog {
  constructor(
    public dialogRef: MatDialogRef<UserSelectionDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  selectUser(user: any): void {
    this.dialogRef.close(user);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
