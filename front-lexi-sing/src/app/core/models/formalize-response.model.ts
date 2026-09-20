export interface FormalizeResponse {
  texto_formal: string;
  gestos_originales: string[];
  fuente: string;
}

export interface Gesto {
  id: string;
  etiqueta: string;
}

export interface Conversation {
  id: string;
  participante: string;
  mensajes: Mensaje[];
}

export interface Mensaje {
  id: string;
  texto: string;
  remitente: string;
  timestamp: string;
}
