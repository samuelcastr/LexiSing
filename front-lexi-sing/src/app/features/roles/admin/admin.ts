import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin implements OnInit {

  userName: string = 'Usuario';
  sidebarOpen = true;
  mobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.getCurrentUser().subscribe((user: User | null) => {
      if (user) {
        this.userName = user.nombre || this.extractNameFromEmail(user.email) || 'Usuario';
      }
    });
  }

  toggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    } else {
      this.sidebarOpen = !this.sidebarOpen;
    }
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  logout() {
    this.authService.logout().subscribe();
  }

  private extractNameFromEmail(email: string): string {
    if (!email) return '';
    const local = email.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
}
