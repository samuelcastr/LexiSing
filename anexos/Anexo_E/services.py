import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
GROQ_MODEL = 'qwen/qwen3.8-27b'
GROQ_TIMEOUT = 10

SYSTEM_PROMPT = (
    'Eres un asistente que convierte secuencias de señas (glosas) '
    'en texto formal empresarial en español. '
    'El contexto de la comunicación es: {contexto}'
)

USER_PROMPT = (
    'Secuencia de señas detectadas: {gestos}\n\n'
    'Instrucciones:\n'
    '- Convierte las glosas en una oración gramaticalmente correcta en español formal y educado.\n'
    '- Mantén el significado original de cada gesto/palabra.\n'
    '- Si las palabras no forman una oración coherente, únelas de la forma más natural posible.\n'
    '- Responde SOLO con la frase formal, sin explicaciones adicionales ni comillas.'
)


class GroqService:

    def __init__(self):
        self.api_key = getattr(settings, 'GROQ_API_KEY', '')
        self.timeout = GROQ_TIMEOUT

    def formalizar(self, gestos: list[str], contexto: str) -> dict:
        if not self.api_key:
            logger.warning('GROQ_API_KEY no configurada. Usando fallback.')
            return self._fallback(gestos)

        gestos_str = ', '.join(gestos)
        payload = {
            'model': GROQ_MODEL,
            'messages': [
                {'role': 'system', 'content': SYSTEM_PROMPT.format(contexto=contexto)},
                {'role': 'user', 'content': USER_PROMPT.format(gestos=gestos_str)},
            ],
            'temperature': 0.3,
            'max_tokens': 200,
        }
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        }

        try:
            response = requests.post(
                GROQ_API_URL,
                json=payload,
                headers=headers,
                timeout=self.timeout,
            )

            if response.status_code == 200:
                data = response.json()
                texto = data['choices'][0]['message']['content'].strip().strip('"\'')
                if texto:
                    return {'texto': texto, 'fuente': 'groq'}

            logger.warning(
                'Groq respondió con status %s: %s',
                response.status_code,
                response.text[:300],
            )
            return self._fallback(gestos)

        except requests.exceptions.Timeout:
            logger.warning('Timeout al llamar a Groq API.')
            return self._fallback(gestos)
        except requests.exceptions.ConnectionError:
            logger.error('Error de conexión con Groq API.')
            return self._fallback(gestos)
        except Exception:
            logger.exception('Error inesperado al llamar a Groq API.')
            return self._fallback(gestos)

    @staticmethod
    def _fallback(gestos: list[str]) -> dict:
        texto = ' '.join(gestos)
        if texto:
            texto = texto[0].upper() + texto[1:]
        if not texto.endswith(('.', '!', '?')):
            texto += '.'
        return {'texto': texto, 'fuente': 'fallback'}
