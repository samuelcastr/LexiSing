export interface FormalizeResponse {
  texto_formal: string;
  gestos_originales: string[];
  fuente: 'groq' | 'fallback';
}
