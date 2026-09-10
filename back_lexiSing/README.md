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

## Reconocimiento de senas (frontend)

El frontend (Angular, `sign-language.service.ts`) reconoce dactilologia LSC y
gestos por MediaPipe HandLandmarker. Dos modos:

- **Deletrear** — abecedario completo (27 letras): A B C D E F G H I J K L M N Ñ O P Q R S T U V W X Y Z
- **Palabras** — gestos completos (ver tabla)

### Letras nuevas agregadas

| Letra | Descripcion |
|-------|-------------|
| H | Indice y medio extendidos juntos, mano en horizontal (se distingue de U/V por orientacion) |
| J | Solo menique extendido trazando un gancho hacia abajo y de regreso arriba (deteccion por trayectoria) |
| M | Pulgar doblado sobre indice/medio/anular con menique de apoyo (se distingue de Y por la posicion del pulgar) |
| N | Indice y medio doblados sobre el pulgar, anular y menique extendidos |
| Ñ | N con la mano subida hasta la mejilla (borde superior del encuadre) |
| P | Cuatro dedos extendidos juntos apuntando hacia abajo (vertical), pulgar abierto |
| Q | Cuatro dedos apuntando hacia abajo en diagonal, pulgar abierto |
| Z | Solo indice extendido trazando un zigzag lateral con dos giros de direccion (deteccion por trayectoria) |

> Nota: Ñ se aproxima sin FaceLandmarker: la mano en N subida al borde
> superior del encuadre se interpreta como la mejilla.

### Gestos de palabras

| Gesto | Significado | | Gesto | Significado |
|-------|-------------|-|-------|-------------|
| PALMA_ABIERTA | Hola | | PUÑO_CERRADO | Gracias |
| PULGAR_ARRIBA | Si | | TRES_DEDOS | Por favor |
| PULGAR_ABAJO | No | | CUATRO_DEDOS | Necesito |
| VICTORIA | Adios | | OK_SIGN | Perfecto |
| TE_QUIERO | Te quiero | | PULGAR_MEÑIQUE | Llamar |
| INDICE_ARRIBA | Atencion | | MEÑIQUE_ARRIBA | Promesa |
| PINZA | Poco | | ONDEO | Adios (ondeo) |
| APUNTAR_ARRIBA | Mira arriba | | APUNTAR_ABAJO | Mira abajo |
| NUMERO_3 | Tres | | NUMERO_6 | Seis |

Gestos bimanuales: ORACION, APLAUSO, PAZ, CORAZON (Amor), PARAR.
Lexico empresarial: REUNION, INFORME, CLIENTE, PAUSA, APROBAR, ENVIAR,
TRABAJAR, PEDIR.

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
