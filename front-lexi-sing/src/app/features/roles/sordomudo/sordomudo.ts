import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-sordomudo',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './sordomudo.html',
  styleUrls: ['./sordomudo.scss']
})
export class Sordomudo implements OnInit {
  userName = 'Usuario';
  sidebarOpen = true;
  mobileMenuOpen = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe((user: User | null) => {
      this.userName = user?.nombre || this.extractNameFromEmail(user?.email || '') || 'Usuario';
    });
  }

  toggleSidebar(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    } else {
      this.sidebarOpen = !this.sidebarOpen;
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  logout(): void {
    this.authService.logout().subscribe();
  }

  private extractNameFromEmail(email: string): string {
    if (!email) return '';
    const local = email.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
}
