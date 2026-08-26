import { Component, OnInit, ViewChild, ElementRef, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ConversationService } from '../../../core/services/conversation.service';
import { AuthService } from '../../../core/services/auth.service';
import { CameraService } from '../../../core/services/camera.service';
import { SignLanguageService, GestoDetectado } from '../../../core/services/sign-language.service';
import { TextFormalizerService } from '../../../core/services/text-formalizer.service';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { UserApiService } from '../../../core/services/user-api.service';
import { ActivityService } from '../../../core/services/activity.service';
import { PresenceService } from '../../../core/services/presence.service';
import { ErrorService } from '../../../core/services/error.service';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatCardModule, MatTooltipModule, MatSelectModule, MatOptionModule, FormsModule],
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss']
})
export class ConversationListComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('landmarksCanvas') landmarksCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  users: any[] = [];
  filteredUsers: any[] = [];
  newConvSearchTerm: string = '';
  selectedUserUid: string = '';
  conversations: any[] = [];
  filteredConversations: any[] = [];
  searchTerm: string = '';
  uid: string = '';
  currentUser: any | null = null;
  showNewConvForm = false;
  cameraActive = false;
  cameraPaused = false;
  isMobile = false;
  selectedConversation: any = null;
  messageText: string = '';
  messages: any[] = [];
  editingMessageId: string | null = null;
  editingText: string = '';
  activeMessageMenuId: string | null = null;
  participantPresence: 'online' | 'offline' = 'offline';
  userRole: string = '';
  mobileSidebarOpen = false;
  senasDetectando = false;
  gestosActuales: GestoDetectado[] = [];
  gestoEnCurso: string | null = null;
  mostrarPreview = false;
  textoTraducido = '';
  gestoConfirmadoFlash: string | null = null;
  modeloCargando = false;
  textoLock = false;
  formalizando = false;
  modoPractica = false;
  manoPerdida = false;
  guiaSenas = [
    { nombre: 'Hola', como: 'Palma abierta' },
    { nombre: 'Sí', como: 'Pulgar arriba' },
    { nombre: 'No', como: 'Pulgar abajo' },
    { nombre: 'Adiós', como: 'Índice + medio en V' },
    { nombre: 'Te quiero', como: 'Pulgar + índice + meñique' },
    { nombre: 'Atención', como: 'Solo índice arriba' },
    { nombre: 'Gracias', como: 'Puño cerrado' },
    { nombre: 'Por favor', como: 'Índice + medio + anular' },
    { nombre: 'Necesito', como: '4 dedos arriba' },
    { nombre: 'Perfecto', como: 'Pulgar toca índice' },
    { nombre: 'Llamar', como: 'Pulgar + meñique' },
    { nombre: 'Promesa', como: 'Solo meñique' },
    { nombre: 'Poco', como: 'Pulgar + índice juntos' },
    { nombre: 'Letra L', como: 'Pulgar + índice en L' },
    { nombre: 'Letra O', como: 'Todas las puntas juntas' },
    { nombre: 'Tres (3)', como: 'Pulgar + índice + medio' },
    { nombre: 'Seis (6)', como: 'Pulgar + meñique, pinza' },
    { nombre: 'Oración ✋✋', como: 'Ambas palmas juntas' },
    { nombre: 'Parar ✋✋', como: 'Ambas palmas adelante' },
    { nombre: 'Paz ✋✋', como: 'Ambas manos en V' },
    { nombre: 'Aplauso ✋✋', como: 'Ambas abiertas juntas' },
    { nombre: 'Amor ✋✋', como: 'Pulgares + índices juntos' },
    { nombre: 'Ondeando ✋', como: 'Mano de lado a lado' },
    { nombre: 'Mira arriba ☝', como: 'Índice apunta arriba' },
    { nombre: 'Mira abajo ☟', como: 'Índice apunta abajo' }
  ];
  private sending = false;
  private destroy$ = new Subject<void>();
  private convSub?: Subscription;
  private usersSub?: Subscription;
  private presenceSub?: Subscription;
  private messagesSub?: Subscription;
  private gestosSub?: Subscription;
  private detectandoSub?: Subscription;
  private gestoEnCursoSub?: Subscription;
  private confirmadoSub?: Subscription;
  private cargandoSub?: Subscription;
  private manoPerdidaSub?: Subscription;

  constructor(
    private elRef: ElementRef,
    private convService: ConversationService,
    private auth: AuthService,
    private router: Router,
    private location: Location,
    private userApi: UserApiService,
    private cameraService: CameraService,
    private signLang: SignLanguageService,
    private textFormalizer: TextFormalizerService,
    private activityService: ActivityService,
    private presenceService: PresenceService,
    private errorService: ErrorService,
    private cdr: ChangeDetectorRef
  ) { }

  private getDisplayName(): string {
    if (!this.currentUser) {
      return 'Usuario';
    }
    return this.currentUser.nombre?.trim() || this.currentUser.email?.split('@')[0] || 'Usuario';
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.isMobile = window.innerWidth < 768;
      this.mobileSidebarOpen = this.isMobile;
    }

    this.auth.getCurrentUser().pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user?.uid) {
        this.currentUser = user;
        this.uid = user.uid;
        this.userRole = user.rol || '';
      } else {
        return;
      }
      this.loadUsers();
    });

    this.gestosSub = this.signLang.gestos$.pipe(takeUntil(this.destroy$)).subscribe(g => {
      this.gestosActuales = [...g];
      this.textoLock = true;
      this.textoTraducido = this.signLang.traducirAhora();
      setTimeout(() => this.textoLock = false, 200);
    });
    this.detectandoSub = this.signLang.detectando$.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.senasDetectando = v;
      if (v && this.cameraActive) {
        this.mostrarPreview = true;
      }
    });
    this.gestoEnCursoSub = this.signLang.gestoEnCurso$.pipe(takeUntil(this.destroy$)).subscribe(g => this.gestoEnCurso = g);
    this.confirmadoSub = this.signLang.confirmado$.pipe(takeUntil(this.destroy$)).subscribe(id => {
      this.gestoConfirmadoFlash = id;
    });
    this.cargandoSub = this.signLang.cargando$.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.modeloCargando = v;
    });
    this.manoPerdidaSub = this.signLang.manoPerdida$.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.manoPerdida = v;
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    if (typeof window === 'undefined') return;
    this.isMobile = window.innerWidth < 768;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.convSub?.unsubscribe();
    this.usersSub?.unsubscribe();
    this.presenceSub?.unsubscribe();
    this.messagesSub?.unsubscribe();
    this.gestosSub?.unsubscribe();
    this.detectandoSub?.unsubscribe();
    this.gestoEnCursoSub?.unsubscribe();
    this.confirmadoSub?.unsubscribe();
    this.cargandoSub?.unsubscribe();
    this.manoPerdidaSub?.unsubscribe();
    this.stopCamera();
  }

  loadConversations(): void {
    this.convSub?.unsubscribe();
    this.convSub = this.convService.getConversationsForUser(this.uid).pipe(takeUntil(this.destroy$)).subscribe(list => {
      this.conversations = list.map(conv => {
        const otherUid = conv.participants?.find(p => p !== this.uid);
        const otherUser = this.users.find(u => u.uid === otherUid);
        return { ...conv, participantName: otherUser?.nombre || 'Conversación' };
      }).sort((a, b) => {
        const timeA = a.updatedAt?.toDate?.() || new Date(0);
        const timeB = b.updatedAt?.toDate?.() || new Date(0);
        return timeB.getTime() - timeA.getTime();
      });

      this.filterConversations();
    });
  }

  filterConversations(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredConversations = [...this.conversations];
      return;
    }

    this.filteredConversations = this.conversations.filter(conv => {
      const name = (conv.participantName || '').toLowerCase();
      const lastMessage = (conv.lastMessage || '').toLowerCase();
      return name.includes(term) || lastMessage.includes(term);
    });
  }

  toggleNewConvForm(): void {
    this.showNewConvForm = !this.showNewConvForm;
    this.selectedUserUid = '';
    this.newConvSearchTerm = '';
    if (this.showNewConvForm) {
      this.loadUsers();
    }
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  openMobileSidebar(): void {
    this.mobileSidebarOpen = true;
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }

  onEmptyStateClick(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.openMobileSidebar();
      return;
    }
    if (this.conversations.length === 0) {
      this.toggleNewConvForm();
    }
  }

  get emptyStateHint(): string {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'Toca para abrir la lista de conversaciones';
    }
    return this.conversations.length === 0
      ? 'Crea una nueva conversación'
      : 'Selecciona una conversación a la izquierda';
  }

  filterUsers(): void {
    const term = this.normalize(this.newConvSearchTerm.trim().toLowerCase());

    if (!term) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter(user => {
      const nombre = this.normalize((user.nombre || '').toLowerCase());
      const email = this.normalize((user.email || '').toLowerCase());
      return nombre.includes(term) || email.includes(term);
    });
  }

  private normalize(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  loadUsers(): void {
    this.usersSub?.unsubscribe();
    this.usersSub = this.userApi.getUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users) => {
        this.users = users.filter(u => u.uid && u.uid !== this.uid);
        this.filterUsers();
        this.loadConversations();
      },
      error: (error) => {
        this.errorService.mostrarError(error, 'Error al cargar los usuarios.');
      }
    });
  }

  createConversation(): void {
    if (!this.selectedUserUid) {
      this.errorService.mostrarError(null, 'Por favor selecciona un usuario.');
      return;
    }

    if (this.selectedUserUid === this.uid) {
      this.errorService.mostrarError(null, 'No puedes crear una conversación contigo mismo.');
      return;
    }

    this.convService.createConversation([this.uid, this.selectedUserUid])
      .then(() => {

        this.activityService.addActivity(
          this.getDisplayName(),
          'inició una conversación'
        );

        this.selectedUserUid = '';
        this.showNewConvForm = false;
        this.loadConversations();

      })
      .catch(error => {
        this.errorService.mostrarError(error, 'Error al crear la conversación.');
      });
  }

  toggleCamera(): void {
    if (this.cameraActive) {
      this.stopCamera();
    } else {
      this.startCamera();
    }
  }

  toggleCameraPause(): void {
    const video = this.videoElement?.nativeElement;
    if (!video) return;

    if (this.cameraPaused) {
      this.cameraPaused = false;
      video.play().then(() => this.signLang.reanudar()).catch(() => {
        this.cameraPaused = true;
        this.errorService.mostrarError(null, 'No se pudo reanudar la cámara.');
      });
    } else {
      this.signLang.pausar();
      video.pause();
      this.cameraPaused = true;
    }
  }

  async startCamera(): Promise<void> {
    try {
      await this.cameraService.startCamera(this.videoElement.nativeElement);
      this.cameraActive = true;
      this.cameraPaused = false;
      this.cdr.detectChanges();
      const canvas = this.landmarksCanvas?.nativeElement ??
        this.elRef.nativeElement.querySelector('canvas.landmarks-canvas');
      this.signLang.iniciar(this.videoElement.nativeElement, canvas).catch(err => {
        console.error('Error al cargar modelo de señas:', err);
        this.errorService.mostrarError(null, 'No se pudo cargar el reconocimiento de señas. Verifica la conexión.');
      });
    } catch (error) {
      this.cameraActive = false;
      this.errorService.mostrarError(null, this.getCameraErrorMessage(error));
    }
  }

  private getCameraErrorMessage(error: unknown): string {
    const name = String((error as any)?.name ?? '');
    if (/NotAllowed|PermissionDenied/i.test(name)) {
      return 'Permiso de cámara denegado. Actívalo desde la configuración del navegador.';
    }
    if (/NotFound|DevicesNotFound|Overconstrained/i.test(name)) {
      return 'No se encontró una cámara disponible en este dispositivo.';
    }
    if (/NotReadable|TrackStart/i.test(name)) {
      return 'La cámara está en uso por otra aplicación. Ciérrala e inténtalo de nuevo.';
    }
    return 'No se pudo acceder a la cámara. Verifica los permisos e inténtalo de nuevo.';
  }

  stopCamera(): void {
    this.signLang.detener();
    this.mostrarPreview = false;
    this.textoTraducido = '';
    if (this.videoElement?.nativeElement) {
      this.cameraService.stopCamera(this.videoElement.nativeElement);
    }
    this.cameraActive = false;
    this.cameraPaused = false;
  }

  trackByUid(index: number, user: any): string {
    return user.uid || index;
  }

  selectConversation(conversation: any): void {
    this.selectedConversation = conversation;
    this.closeMobileSidebar();
    this.loadMessages(conversation.id);

    const otherUid = conversation.participants?.find((p: string) => p !== this.uid);
    if (otherUid) {
      this.presenceSub?.unsubscribe();
      this.presenceSub = this.presenceService.observePresence(otherUid).subscribe(status => {
        this.participantPresence = status;
      });
    }

    if (this.userRole === 'sordomudo' && !this.cameraActive) {
      setTimeout(() => {
        this.startCamera();
      }, 500);
    }
  }

  loadMessages(convId: string): void {
    this.messagesSub?.unsubscribe();
    this.messages = [];
    this.messagesSub = this.convService.getMessages(convId).pipe(takeUntil(this.destroy$)).subscribe(msgs => {
      this.messages = msgs.filter(msg => !msg.deleted);
      this.scrollToBottom();
    });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        if (this.messagesContainer?.nativeElement) {
          this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
        }
      } catch (err) {
        // El contenedor aún no está disponible
      }
    }, 0);
  }

  goBack(): void {
    if (this.router.url.includes('/roles/supervisor/conversations')) {
      this.router.navigate(['/roles/supervisor/dashboard']);
    } else if (this.router.url.includes('/roles/admin/conversations')) {
      this.router.navigate(['/roles/admin/dashboard']);
    } else if (this.router.url.includes('/roles/empleados/conversations')) {
      this.router.navigate(['/roles/empleados/dashboard']);
    } else if (this.router.url.includes('/roles/sordomudo/conversations')) {
      this.router.navigate(['/roles/sordomudo/dashboard']);
    } else if (this.router.url.includes('/roles/usuario/conversations')) {
      this.router.navigate(['/roles/usuario']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
  sendMessage(): void {
    if (this.sending || !this.messageText.trim() || !this.selectedConversation?.id) {
      return;
    }

    const content = this.messageText;
    this.messageText = '';
    this.sending = true;

    this.convService.sendMessage(this.selectedConversation.id, {
      content,
      senderUid: this.uid
    }).then(() => {

      this.activityService.addActivity(
        this.getDisplayName(),
        'envió un mensaje'
      );

      this.scrollToBottom();

    }).catch(error => {
      this.errorService.mostrarError(error, 'Error al enviar el mensaje.');
    }).finally(() => {
      this.sending = false;
    });
  }

  toggleMessageMenu(messageId: string | null): void {
    this.activeMessageMenuId = this.activeMessageMenuId === messageId ? null : messageId;
  }

  onMessageContextMenu(event: MouseEvent, message: any): void {
    event.preventDefault();
    if (message?.senderUid === this.uid) {
      this.toggleMessageMenu(message.id);
    }
  }

  startEditMessage(message: any): void {
    this.activeMessageMenuId = null;
    this.editingMessageId = message.id;
    this.editingText = message.content;
  }

  cancelEditMessage(): void {
    this.editingMessageId = null;
    this.editingText = '';
  }

  saveEditMessage(message: any): void {
    if (!this.selectedConversation?.id || !message?.id || !this.editingText.trim()) {
      return;
    }

    this.convService.editMessage(this.selectedConversation.id, message.id, this.editingText.trim())
      .then(() => {
        this.messages = this.messages.map(m =>
          m.id === message.id ? { ...m, content: this.editingText.trim(), edited: true } : m
        );
        this.editingMessageId = null;
        this.editingText = '';
        this.scrollToBottom();
      })
      .catch(error => {
        this.errorService.mostrarError(error, 'Error al editar el mensaje.');
      });
  }

  deleteMessage(message: any): void {
    if (!this.selectedConversation?.id || !message?.id) {
      return;
    }

    this.activeMessageMenuId = null;
    this.convService.softDeleteMessage(this.selectedConversation.id, message.id)
      .then(() => {
        this.editingMessageId = null;
      })
      .catch(error => {
        this.errorService.mostrarError(error, 'Error al eliminar el mensaje.');
      });
  }

  abrirPreviewTraduccion(): void {
    if (!this.textoTraducido) {
      this.textoTraducido = this.signLang.traducirAhora();
    }
    this.mostrarPreview = true;
  }

  limpiarGestos(): void {
    this.signLang.limpiar();
    this.textoTraducido = '';
  }

  eliminarGesto(index: number): void {
    this.signLang.eliminarGesto(index);
  }

  formalizarTexto(): void {
    if (this.gestosActuales.length === 0 || this.formalizando) {
      return;
    }

    this.formalizando = true;
    this.textoLock = true;

    const gestos = this.gestosActuales.map(g => g.etiqueta);

    this.textFormalizer.formalize(gestos).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.textoTraducido = res.texto_formal;
        this.formalizando = false;
        setTimeout(() => this.textoLock = false, 200);
      },
      error: () => {
        this.formalizando = false;
        setTimeout(() => this.textoLock = false, 200);
        this.errorService.mostrarError(null, 'No se pudo formalizar el texto. Se enviará sin formato.');
      }
    });
  }

  togglePractica(): void {
    this.modoPractica = !this.modoPractica;
  }

  cerrarPreview(): void {
    this.mostrarPreview = false;
    this.textoTraducido = '';
  }

  enviarTraduccion(): void {
    if (!this.textoTraducido.trim()) {
      return;
    }
    this.messageText = this.textoTraducido.trim();
    this.mostrarPreview = false;
    this.textoTraducido = '';
    this.signLang.limpiar();
    this.sendMessage();
  }
}



