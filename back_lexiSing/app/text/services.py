import logging, requests
from django.conf import settings
logger = logging.getLogger(__name__)
SYSTEM_PROMPT = 'Eres un asistente que convierte secuencias de señas (glosas) en texto formal empresarial en español. Contexto: {contexto}'
USER_PROMPT = 'Secuencia de señas detectadas: {gestos}\nInstrucciones: Convierte las glosas en texto formal empresarial. Responde SOLO con la frase formal.'
class GroqService:
    def __init__(self):
        self.api_key = getattr(settings, 'GROQ_API_KEY', '')
        self.api_url = getattr(settings, 'GROQ_API_URL', 'https://api.groq.com/openai/v1/chat/completions')
        self.model = getattr(settings, 'GROQ_MODEL', 'qwen/qwen3.8-27b')
        self.timeout = int(getattr(settings, 'GROQ_TIMEOUT', '10'))
    def formalizar(self, gestos: list[str], contexto: str) -> dict:
        if not self.api_key: return self._fallback(gestos)
        payload = {'model': self.model, 'messages': [{'role':'system','content': SYSTEM_PROMPT.format(contexto=contexto)},{'role':'user','content': USER_PROMPT.format(gestos=', '.join(gestos))}], 'temperature': 0.3, 'max_tokens': 200}
        headers = {'Authorization': f'Bearer {self.api_key}', 'Content-Type': 'application/json'}
        try:
            response = requests.post(self.api_url, json=payload, headers=headers, timeout=self.timeout)
            if response.status_code == 200:
                data = response.json()
                texto = data['choices'][0]['message']['content'].strip().strip('"\'')
                if texto: return {'texto': texto, 'fuente': 'groq'}
            return self._fallback(gestos)
        except: return self._fallback(gestos)
    @staticmethod
    def _fallback(gestos: list[str]) -> dict:
        texto = ' '.join(gestos)
        if texto: texto = texto[0].upper() + texto[1:]
        if not texto.endswith(('.', '!', '?')): texto += '.'
        return {'texto': texto, 'fuente': 'fallback'}
