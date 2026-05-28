# back_lexiSing

Backend base creado con Django y Django REST Framework.

## Instrucciones paso a paso

1. Crear un entorno virtual:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
2. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Aplicar migraciones:
   ```bash
   python manage.py migrate
   ```
4. Ejecutar la aplicación:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```
5. Verificar que el backend está corriendo:
   ```bash
   curl -sSf http://127.0.0.1:8000/api/health/
   ```

## URLs útiles

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/api/`
- `http://127.0.0.1:8000/api/health/`

## Notas para quien verifica el proyecto

- Asegurarse de activar el entorno virtual antes de ejecutar los comandos.
- Si se usan rutas absolutas, estar en la carpeta `back_lexiSing`.
- El servidor de desarrollo está en el puerto `8000`.
- Para revisar que la API responde correctamente, usar el endpoint de health.
