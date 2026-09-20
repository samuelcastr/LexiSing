import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `<div class="container"><h1>LexiSing</h1><p>Plataforma de comunicación por Lengua de Señas Colombiana</p><p>Señas configuradas: {{ totalSeñas }}</p></div>`,
  styles: ['.container { padding: 20px; text-align: center; } h1 { color: #6200ee; }']
})
export class HomeComponent { totalSeñas = 400; }
