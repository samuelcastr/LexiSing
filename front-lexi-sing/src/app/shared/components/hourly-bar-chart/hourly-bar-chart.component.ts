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
      }).catch(() => {
        this.datosPendientes = true;
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

    const trace = {
      x: horas.map(h => `${h}:00`),
      y: valores,
      type: 'bar',
      name: this.seriesName,
      marker: { color: valores, colorscale: 'Blues' }
    };

    const layout = {
      title: '',
      xaxis: { title: 'Hora del día' },
      yaxis: { title: 'Cantidad' },
      font: { family: 'Arial', size: 12 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      height: 320
    };

    this.Plotly.react(el, [trace], layout, { responsive: true });
  }
}
