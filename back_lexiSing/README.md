# LexiSing - Backend

API REST construida con Django 6 y Django REST Framework.

## Inicio rapido

```bash
# Entorno virtual
python3 -m venv .venv
source .venv/bin/activate

# Dependencias
pip install -r requirements.txt

# Variables de entorno — crear .env
echo 'GROQ_API_KEY=gsk_tu_clave' > .env

# Ejecutar
python manage.py runserver 0.0.0.0:8000
```

## Endpoints

| Metodo | Endpoint | Auth | Descripcion |
|--------|----------|------|-------------|
| GET | `/api/health/` | No | Health check |
| GET | `/api/users/me/` | Si | Perfil del usuario |
| GET | `/api/users/` | No | Lista de usuarios |
| GET/POST | `/api/conversations/` | Si | Conversaciones |
| POST | `/api/text/formalize/` | Si | Formalizar texto con IA |

## Apps Django

- **users** — Perfil de usuarios, listado, health check
- **text** — Formalizacion de glosas de senas a texto formal (Groq API)

## Dependencias

- Django 6.0.5
- djangorestframework 3.17.1
- firebase-admin 6.5.0
- django-cors-headers 4.3.1
- python-dotenv 1.1.0
- requests 2.32.3
