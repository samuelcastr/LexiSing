import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sordomudo-role',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sordomudo.component.html',
  styleUrls: ['./sordomudo.component.scss']
})
export class SordomudoComponent implements OnInit, OnDestroy {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;

  cameraStatus = 'Detenida';
  recognizedText = 'Mueve tu mano frente a la cámara para iniciar la traducción.';
  history: string[] = [];
  private mediaStream: MediaStream | null = null;
  private recognitionInterval?: number;
  private samplePhrases = [
    'Hola',
    '¿Cómo estás?',
    'Gracias',
    'Necesito ayuda',
    'Estoy aprendiendo señas'
  ];

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async startCamera(): Promise<void> {
    if (this.mediaStream) {
      return;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.nativeElement.srcObject = this.mediaStream;
      this.cameraStatus = 'Cámara activa';
      this.recognizedText = 'Analizando movimiento de mano...';
      this.startRecognitionSimulation();
    } catch (error) {
      this.cameraStatus = 'Error al iniciar cámara';
      this.recognizedText = 'No pudimos acceder a la cámara. Revisa tus permisos.';
    }
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.recognitionInterval) {
      window.clearInterval(this.recognitionInterval);
      this.recognitionInterval = undefined;
    }

    this.cameraStatus = 'Detenida';
  }

  private startRecognitionSimulation(): void {
    let index = 0;
    this.recognitionInterval = window.setInterval(() => {
      const phrase = this.samplePhrases[index % this.samplePhrases.length];
      this.recognizedText = phrase;
      this.addToHistory(phrase);
      index += 1;
    }, 2600);
  }

  private addToHistory(message: string): void {
    this.history = [message, ...this.history].slice(0, 5);
  }
}
