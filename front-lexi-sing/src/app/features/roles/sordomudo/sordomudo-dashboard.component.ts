import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SordomudoComponent } from './sordomudo.component';
import { ChangeDetectorRef } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ConversationService } from '../../../core/services/conversation.service';
import { UserApiService } from '../../../core/services/user-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { firstValueFrom, Observable } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-sordomudo-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SordomudoComponent, MatIconModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './sordomudo-dashboard.component.html',
  styleUrls: ['./sordomudo-dashboard.component.scss']
})
export class SordomudoDashboardComponent implements AfterViewInit {
  @ViewChild(SordomudoComponent) child?: SordomudoComponent;

  traduccionesHoy$?: Observable<number>;
  sesionesActivas$?: Observable<number>;
  totalConversations$?: Observable<number>;
  recentActivity$?: Observable<any[]>;

  constructor(
    private cdr: ChangeDetectorRef,
    private snack: MatSnackBar,
    private dashboard: DashboardService,
    private conversationService: ConversationService,
    private userApi: UserApiService,
    private authService: AuthService
  ) {}

  ngAfterViewInit(): void {
    // Child component becomes available after view init; ensure change detection runs
    this.cdr.detectChanges();
    // iniciar observables de dashboard
    this.traduccionesHoy$ = this.dashboard.getTraduccionesHoy();
    this.sesionesActivas$ = this.dashboard.getSesionesActivas();
    this.totalConversations$ = this.dashboard.getTotalConversations();
    this.recentActivity$ = this.dashboard.getRecentActivity();
  }

  sessionStarted = false;
  sidebarOpen = true;

  get recognizedText(): string {
    return this.child ? this.child.recognizedText : '';
  }

  get cameraStatus(): string {
    return this.child ? this.child.cameraStatus : 'Detenida';
  }

  get history(): string[] {
    return this.child ? this.child.history : [];
  }

  copyRecognized(): void {
    const text = this.recognizedText;
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => this.snack.open('Texto copiado al portapapeles', 'OK', { duration: 2000 }))
      .catch(() => this.snack.open('No se pudo copiar el texto', 'OK', { duration: 2000 }));
  }

  clearHistory(): void {
    if (this.child) {
      this.child.history = [];
      this.snack.open('Historial limpiado', 'OK', { duration: 1500 });
    }
  }

  startCamera(): void {
    if (!this.sessionStarted) {
      this.snack.open('Entra primero a la sesión para iniciar la cámara', 'OK', { duration: 1800 });
      return;
    }

    // Start and notify
    const promise = this.child?.startCamera();
    if (promise) {
      promise.then(() => {
        this.snack.open('Cámara iniciada', 'OK', { duration: 1400 });
      }).catch(() => {
        this.snack.open('No se pudo iniciar la cámara', 'OK', { duration: 1800 });
      });
    } else {
      this.snack.open('Componente no listo para iniciar cámara', 'OK', { duration: 1600 });
    }
  }

  stopCamera(): void {
    this.child?.stopCamera();
    this.snack.open('Cámara detenida', 'OK', { duration: 1200 });
  }

  enterSession(): void {
    this.sessionStarted = true;
    // allow child to initialize; detect changes after view update
    setTimeout(() => this.cdr.detectChanges());
    this.snack.open('Sesión iniciada — listo para traducir', 'OK', { duration: 1500 });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  async seedTestData(): Promise<void> {
    try {
      const user = await firstValueFrom(this.authService.getCurrentUser());
      if (!user?.uid) {
        this.snack.open('Necesitas estar autenticado para generar datos de prueba', 'OK', { duration: 2500 });
        return;
      }

      const users = await firstValueFrom(this.userApi.getUsers());
      const partner = users.find(u => u.uid && u.uid !== user.uid);
      const participants = partner ? [user.uid, partner.uid] : [user.uid, user.uid];

      const conv = await this.conversationService.createConversation(participants);
      const convId = conv.id || (conv as any)._path?.segments?.slice(-1)[0];

      const messages = [
        'Hola, estoy aquí para ayudarte con señas.',
        '¿Puedes mostrarme tu mano?',
        'Perfecto, ya lo estoy traduciendo.'
      ];

      for (const content of messages) {
        await this.conversationService.sendMessage(convId, { senderUid: user.uid, content });
      }

      this.snack.open('Datos de prueba creados correctamente', 'OK', { duration: 2500 });
      this.traduccionesHoy$ = this.dashboard.getTraduccionesHoy();
      this.sesionesActivas$ = this.dashboard.getSesionesActivas();
      this.totalConversations$ = this.dashboard.getTotalConversations();
      this.recentActivity$ = this.dashboard.getRecentActivity();
    } catch (error) {
      console.error('Error creando datos de prueba:', error);
      this.snack.open('No se pudieron crear datos de prueba', 'OK', { duration: 2500 });
    }
  }

  logout(): void {
    // placeholder: navigate to login or call auth service
    window.location.href = '/login';
  }
}
