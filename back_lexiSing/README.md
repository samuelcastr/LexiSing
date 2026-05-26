# back_lexiSing

Backend base creado con FastAPI.

## Instrucciones rápidas

1. Crear un entorno virtual:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
2. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Correr la aplicación:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
4. Abrir en el navegador:
   - http://127.0.0.1:8000
   - http://127.0.0.1:8000/docs
