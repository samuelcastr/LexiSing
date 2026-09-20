import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CameraService {
  private stream: MediaStream | null = null;

  async obtenerCamara(): Promise<MediaStream> {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
    return this.stream;
  }

  detener(): void { if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; } }
  getStream(): MediaStream | null { return this.stream; }
}
