import { Component, OnInit, OnDestroy, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { ConversationService } from '../../../../core/services/conversation.service';
import { ActivityService } from '../../../../core/services/activity.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatCardModule, MatTabsModule],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.scss']
})
export class Reportes implements OnInit, OnDestroy, AfterViewInit {
  totalUsuarios = 0;
  totalConversaciones = 0;
  totalMensajes = 0;
  usuariosActivos = 0;
  mensajesPorHora: { hour: string; count: number }[] = [];
  mensajesDays = 0;
  activeTab = 0;

  private Plotly: any;
  private datosGraficos: any = {};
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private convService: ConversationService,
    private activityService: ActivityService,
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
        this.renderChartForActiveTab();
      });
    }
  }

  loadEstadisticas(): void {
    this.dashboardService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.totalUsuarios = users.length;
      this.usuariosActivos = users.filter(u => u.activo).length;
      this.datosGraficos.users = users;
      this.renderChartForActiveTab();
    });

    this.convService.getAllConversations().pipe(takeUntil(this.destroy$)).subscribe(conversations => {
      this.totalConversaciones = conversations.length;
      this.datosGraficos.conversations = conversations;
      this.renderChartForActiveTab();
    });

    this.dashboardService.getMensajes().pipe(takeUntil(this.destroy$)).subscribe(messages => {
      this.totalMensajes = messages.length;
      this.datosGraficos.messages = messages;
      this.mensajesPorHora = this.calculateMessagesByHour(messages);
      this.mensajesDays = this.calculateMessageDays(messages);
      this.renderChartForActiveTab();
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

  onTabChange(index: number): void {
    this.activeTab = index;
    this.renderChartForActiveTab();
  }

  private renderChartForActiveTab(retry = 0): void {
    if (!this.Plotly) return;

    const data = this.datosGraficos;
    const elementId =
      this.activeTab === 0 && data.users ? 'grafico-usuarios'
      : this.activeTab === 1 && data.conversations ? 'grafico-conversaciones'
      : this.activeTab === 2 && data.conversations ? 'grafico-3d'
      : this.activeTab === 3 && data.messages ? 'grafico-mensajes'
      : null;

    if (!elementId) return;

    const el = document.getElementById(elementId);
    if (!el || !el.clientWidth || !el.clientHeight) {
      if (retry < 40) {
        setTimeout(() => this.renderChartForActiveTab(retry + 1), 50);
      }
      return;
    }

    switch (elementId) {
      case 'grafico-usuarios':
        this.crearGraficoUsuarios(data.users);
        break;
      case 'grafico-conversaciones':
        this.crearGraficoConversaciones(data.conversations);
        break;
      case 'grafico-3d':
        this.crearGrafico3DActividad(data.conversations);
        break;
      case 'grafico-mensajes':
        this.crearGraficoMensajes(data.messages);
        break;
    }
  }

  crearGraficoUsuarios(users: any[]): void {
    if (!document.getElementById('grafico-usuarios')) return;

    const activos = users.filter(u => u.activo).length;
    const inactivos = users.filter(u => !u.activo).length;

    const labels = ['Activos', 'Inactivos'];
    const values = [activos, inactivos];

    const trace = {
      labels,
      values,
      type: 'pie',
      hole: 0.38,
      textinfo: 'label+percent',
      hovertemplate: '%{label}: <b>%{value}</b> (%{percent})<extra></extra>',
      marker: { colors: ['#6d4cff', '#e5e7eb'], line: { color: '#ffffff', width: 2 } }
    };

    const layout = {
      title: `Estado de Usuarios (${activos + inactivos})`,
      height: 420,
      font: { family: 'Arial', size: 12 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { l: 20, r: 20, t: 50, b: 20 },
      showlegend: true,
      legend: { orientation: 'v', x: 1.02, y: 0.5 }
    };

    this.Plotly.react('grafico-usuarios', [trace], layout, { responsive: true, displayModeBar: false });
  }

  private obtenerMs(fecha: any): number {
    if (!fecha) return 0;
    if (typeof fecha.toDate === 'function') {
      const d = fecha.toDate();
      return d instanceof Date ? d.getTime() : 0;
    }
    if (fecha.seconds !== undefined) return fecha.seconds * 1000;
    if (fecha instanceof Date) return fecha.getTime();
    return 0;
  }

  crearGraficoConversaciones(conversations: any[]): void {
    if (!document.getElementById('grafico-conversaciones')) return;

    // Agrupar conversaciones por fecha (YYYY-MM-DD)
    const dateCount: { [date: string]: number } = {};
    conversations.forEach(conv => {
      let fecha: Date | null = null;
      if (conv.updatedAt?.toDate) fecha = conv.updatedAt.toDate();
      else if (conv.fechaCreacion?.toDate) fecha = conv.fechaCreacion.toDate();
      else if (conv.updatedAt) fecha = new Date(conv.updatedAt);
      else if (conv.createdAt) fecha = new Date(conv.createdAt);

      if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) return;
      const key = fecha.toISOString().slice(0, 10); // YYYY-MM-DD
      dateCount[key] = (dateCount[key] || 0) + 1;
    });

    const dates = Object.keys(dateCount).sort();
    const counts = dates.map(d => dateCount[d]);

    const trace = {
      x: dates,
      y: counts,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Conversaciones',
      line: { color: '#6d4cff', width: 3 },
      marker: { size: 6, color: '#8b5cf6' },
      hovertemplate: '%{x}<br><b>%{y}</b> conversaciones<extra></extra>'
    };

    const layout = {
      title: 'Conversaciones por Fecha',
      xaxis: { title: 'Fecha', type: 'date', tickformat: '%d %b', automargin: true },
      yaxis: { title: 'Cantidad de conversaciones', autorange: true, rangemode: 'tozero', gridcolor: 'rgba(148,163,184,0.12)' },
      font: { family: 'Arial', size: 12 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      height: 420,
      margin: { l: 60, r: 30, t: 50, b: 60 }
    };

    this.Plotly.react('grafico-conversaciones', [trace], layout, { responsive: true });
  }

  crearGrafico3DActividad(conversations: any[]): void {
    if (!document.getElementById('grafico-3d')) return;

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
      x: x,
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

    this.Plotly.react('grafico-3d', [trace], layout, { responsive: true });
  }

  crearGraficoMensajes(messages: any[]): void {
    if (!document.getElementById('grafico-mensajes')) return;

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

    this.Plotly.react('grafico-mensajes', [trace], layout, { responsive: true });
  }
}
