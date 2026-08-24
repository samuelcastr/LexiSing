import { Component, ElementRef, Inject, Input, OnChanges, SimpleChanges, ViewChild, AfterViewInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DatoPorHora } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-hourly-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hourly-bar-chart.component.html',
  styleUrls: ['./hourly-bar-chart.component.scss']
})
export class HourlyBarChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() title = 'Actividad por hora';
  @Input() seriesName = 'Registros';
  @Input() data: DatoPorHora[] = [];

  @ViewChild('chartEl', { static: true }) chartEl!: ElementRef<HTMLDivElement>;

  private Plotly: any;
  private datosPendientes = false;
  private resizeObserver?: ResizeObserver;
  private yaGraficada = false;
  private ultimaFirma = '';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.observarCambioTamanio();
      import('plotly.js-dist').then(plotly => {
        this.Plotly = plotly;
        if (this.datosPendientes) {
          this.datosPendientes = false;
          this.render();
        }
      }).catch(err => {
        console.error('No se pudo cargar Plotly', err);
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.Plotly && this.chartEl?.nativeElement) {
      this.Plotly.purge(this.chartEl.nativeElement);
    }
  }

  private observarCambioTamanio(): void {
    const el = this.chartEl?.nativeElement;
    if (!el || typeof ResizeObserver === 'undefined') return;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.Plotly) {
        this.render();
      }
    });
    this.resizeObserver.observe(el);
  }

  private render(): void {
    if (!this.Plotly || !this.chartEl?.nativeElement) {
      this.datosPendientes = true;
      return;
    }

    const el = this.chartEl.nativeElement;
    if (!el.clientWidth || !el.clientHeight) {
      this.datosPendientes = true;
      return;
    }

    const horas = Array.from({ length: 24 }, (_, h) => h);
    const mapa = new Map<number, number>(this.data.map(d => [d.hour, d.count]));
    const valores = horas.map(h => mapa.get(h) || 0);
    const etiquetas = horas.map(h => `${h}:00`);
    const firma = JSON.stringify(valores);

    const trace = {
      x: etiquetas,
      y: valores,
      type: 'bar',
      name: this.seriesName,
      marker: {
        color: valores,
        colorscale: [
          ['0', '#eff6ff'],
          ['0.25', '#bfdbfe'],
          ['0.5', '#60a5fa'],
          ['0.75', '#2563eb'],
          ['1', '#1e40af']
        ],
        line: { width: 0 }
      },
      hovertemplate: `<b>%{y}</b> ${this.seriesName.toLowerCase()} · %{x}<extra></extra>`,
      hoverlabel: {
        bgcolor: '#1e293b',
        bordercolor: '#1e293b',
        font: { color: '#ffffff', family: 'Arial', size: 13 }
      }
    };

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Arial', size: 12, color: '#64748b' },
      height: 320,
      margin: { t: 16, r: 12, b: 32, l: 42 },
      bargap: 0.3,
      barcornerradius: 8,
      showlegend: false,
      xaxis: {
        tickvals: etiquetas.filter((_, h) => h % 3 === 0),
        showgrid: false,
        zeroline: false,
        linecolor: 'rgba(100,116,139,0.35)',
        fixedrange: true
      },
      yaxis: {
        gridcolor: 'rgba(148,163,184,0.22)',
        gridwidth: 1,
        zeroline: false,
        fixedrange: true
      }
    };

    // Usar Plotly.react en cada render garantiza que los ejes y escalas
    // se actualicen correctamente cuando cambian los datos.
    this.Plotly.react(el, [trace], layout, { responsive: true, displayModeBar: false });
    this.yaGraficada = true;

    this.ultimaFirma = firma;
  }
}
