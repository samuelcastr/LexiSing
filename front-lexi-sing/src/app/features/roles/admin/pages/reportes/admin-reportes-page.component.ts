import { Component, OnInit, OnDestroy, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DashboardService } from '../../../../../core/services/dashboard.service';
import { ConversationService } from '../../../../../core/services/conversation.service';
import { User } from '../../../../../core/models/user.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-reportes-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, MatTabsModule],
  templateUrl: './admin-reportes-page.component.html',
  styleUrls: ['./admin-reportes-page.component.scss']
})
export class AdminReportesPageComponent implements OnInit, OnDestroy, AfterViewInit {
  totalUsuarios = 0;
  totalConversaciones = 0;
  totalMensajes = 0;
  usuariosActivos = 0;
  mensajesPorHora: { hour: string; count: number }[] = [];
  mensajesDays = 0;

  private Plotly: any;
  private datosGraficos: any = {};
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private convService: ConversationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadEstadisticas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      import('plotly.js-dist').then(plotly => {
        this.Plotly = plotly;
        setTimeout(() => {
          this.crearTodosGraficos();
        }, 1000);
      });
    }
  }

  loadEstadisticas(): void {
    this.dashboardService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe((users: User[]) => {
      this.totalUsuarios = users.length;
      this.usuariosActivos = users.filter(u => u.activo).length;
      this.datosGraficos.users = users;
    });

    this.convService.getAllConversations().pipe(takeUntil(this.destroy$)).subscribe(conversations => {
      this.totalConversaciones = conversations.length;
      this.datosGraficos.conversations = conversations;
    });

    this.dashboardService.getMensajes().pipe(takeUntil(this.destroy$)).subscribe((messages: any[]) => {
      this.totalMensajes = messages.length;
      this.datosGraficos.messages = messages;
      this.mensajesPorHora = this.calculateMessagesByHour(messages);
      this.mensajesDays = this.calculateMessageDays(messages);
    });
  }

  private calculateMessagesByHour(messages: any[]): { hour: string; count: number }[] {
    const horaMap: { [key: number]: number } = {};
    messages.forEach(msg => {
      const fecha = msg.timestamp?.toDate?.();
      if (fecha) {
        const hora = fecha.getHours();
        horaMap[hora] = (horaMap[hora] || 0) + 1;
      }
    });

    return Array.from({ length: 24 }, (_, i) => i)
      .map(hour => ({ hour: this.formatHour(hour), count: horaMap[hour] || 0 }));
  }

  private formatHour(hour: number): string {
    const suffix = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}${suffix}`;
  }

  private calculateMessageDays(messages: any[]): number {
    const daySet = new Set<string>();
    messages.forEach(msg => {
      const fecha = msg.timestamp?.toDate?.();
      if (fecha) {
        const dayKey = `${fecha.getFullYear()}-${fecha.getMonth() + 1}-${fecha.getDate()}`;
        daySet.add(dayKey);
      }
    });
    return daySet.size;
  }

  crearTodosGraficos(): void {
    if (!this.Plotly) return;
    if (this.datosGraficos.users) {
      this.crearGraficoUsuarios(this.datosGraficos.users);
    }
  }

  onTabChange(index: number): void {
    if (!this.Plotly) return;

    setTimeout(() => {
      if (index === 0 && this.datosGraficos.users) {
        this.crearGraficoUsuarios(this.datosGraficos.users);
      } else if (index === 1 && this.datosGraficos.conversations) {
        this.crearGraficoConversaciones(this.datosGraficos.conversations);
      } else if (index === 2 && this.datosGraficos.conversations) {
        this.crearGrafico3DActividad(this.datosGraficos.conversations);
      } else if (index === 3 && this.datosGraficos.messages) {
        this.crearGraficoMensajes(this.datosGraficos.messages);
      }
    }, 100);
  }

  crearGraficoUsuarios(users: any[]): void {
    if (!document.getElementById('admin-grafico-usuarios')) return;

    const activos = users.filter(u => u.activo).length;
    const inactivos = users.length - activos;
    const total = users.length;

    const puntos = [];
    const numPuntos = 100;

    for (let i = 0; i < numPuntos; i++) {
      const angulo = (i / numPuntos) * Math.PI * 2;
      const x = Math.cos(angulo) * 5;
      const y = Math.sin(angulo) * 5;
      const z = Math.sin(angulo * 2) * 2;

      const porcentajeActivos = activos / total;
      const esActivo = (i / numPuntos) < porcentajeActivos;

      puntos.push({ x, y, z, activo: esActivo });
    }

    const activosData = puntos.filter(p => p.activo);
    const inactivosData = puntos.filter(p => !p.activo);

    const trace1 = {
      x: activosData.map(p => p.x),
      y: activosData.map(p => p.y),
      z: activosData.map(p => p.z),
      type: 'scatter3d',
      mode: 'lines+markers',
      name: `Activos (${activos})`,
      line: { color: '#6d4cff', width: 4 },
      marker: { size: 6, color: '#6d4cff', opacity: 0.9 }
    };

    const trace2 = {
      x: inactivosData.map(p => p.x),
      y: inactivosData.map(p => p.y),
      z: inactivosData.map(p => p.z),
      type: 'scatter3d',
      mode: 'lines+markers',
      name: `Inactivos (${inactivos})`,
      line: { color: '#e5e7eb', width: 4 },
      marker: { size: 6, color: '#e5e7eb', opacity: 0.8 }
    };

    const layout = {
      title: 'Estado de Usuarios 3D',
      scene: {
        xaxis: { title: '' },
        yaxis: { title: '' },
        zaxis: { title: '' },
        camera: { eye: { x: 1.5, y: 1.5, z: 1.3 } }
      },
      font: { family: 'Arial', size: 12 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      height: 450,
      margin: { l: 0, r: 0, t: 40, b: 0 },
      showlegend: true,
      legend: { x: 0.7, y: 0.9, bgcolor: 'rgba(0,0,0,0.5)', bordercolor: '#fff', borderwidth: 1 }
    };

    this.Plotly.newPlot('admin-grafico-usuarios', [trace1, trace2], layout, { responsive: true });
  }

  crearGraficoConversaciones(conversations: any[]): void {
    if (!document.getElementById('admin-grafico-conversaciones')) return;

    const participantCount: { [key: string]: number } = {};
    conversations.forEach(conv => {
      const count = conv.participants?.length || 0;
      const key = `${count} participantes`;
      participantCount[key] = (participantCount[key] || 0) + 1;
    });

    const trace = {
      x: Object.keys(participantCount),
      y: Object.values(participantCount),
      type: 'bar',
      marker: { color: '#8b5cf6' }
    };

    const layout = {
      title: 'Conversaciones por Participantes',
      xaxis: { title: 'Tipo' },
      yaxis: { title: 'Cantidad' },
      font: { family: 'Arial', size: 12 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      height: 450
    };

    this.Plotly.newPlot('admin-grafico-conversaciones', [trace], layout, { responsive: true });
  }

  crearGrafico3DActividad(conversations: any[]): void {
    if (!document.getElementById('admin-grafico-3d')) return;

    const actividadMap: { [key: string]: number } = {};
    conversations.forEach(conv => {
      const fecha = conv.updatedAt?.toDate?.();
      if (fecha) {
        const dia = fecha.toLocaleDateString();
        actividadMap[dia] = (actividadMap[dia] || 0) + 1;
      }
    });

    const dias = Object.keys(actividadMap).slice(-7);
    const valores = dias.map(dia => actividadMap[dia]);
    const x = Array.from({ length: dias.length }, (_, i) => i);

    const trace = {
      x,
      y: Array(dias.length).fill(0).map((_, i) => i % 3),
      z: valores,
      type: 'scatter3d',
      mode: 'markers+lines',
      marker: { size: 8, color: valores, colorscale: 'Viridis', showscale: true },
      line: { color: '#6d4cff', width: 3 }
    };

    const layout = {
      title: 'Actividad 3D (Últimos 7 días)',
      scene: { xaxis: { title: 'Días' }, yaxis: { title: 'Grupo' }, zaxis: { title: 'Conversaciones' } },
      font: { family: 'Arial', size: 12 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      height: 500
    };

    this.Plotly.newPlot('admin-grafico-3d', [trace], layout, { responsive: true });
  }

  crearGraficoMensajes(messages: any[]): void {
    if (!document.getElementById('admin-grafico-mensajes')) return;

    const horaMap: { [key: number]: number } = {};
    messages.forEach(msg => {
      const fecha = msg.timestamp?.toDate?.();
      if (fecha) {
        const hora = fecha.getHours();
        horaMap[hora] = (horaMap[hora] || 0) + 1;
      }
    });

    const horas = Array.from({ length: 24 }, (_, i) => i);
    const trace = {
      x: horas.map(h => `${h}:00`),
      y: horas.map(h => horaMap[h] || 0),
      type: 'bar',
      marker: { color: horas.map(h => horaMap[h] || 0), colorscale: 'Blues' }
    };

    const layout = {
      title: 'Mensajes por Hora del Día',
      xaxis: { title: 'Hora' },
      yaxis: { title: 'Cantidad de Mensajes' },
      font: { family: 'Arial', size: 12 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      height: 450
    };

    this.Plotly.newPlot('admin-grafico-mensajes', [trace], layout, { responsive: true });
  }
}
