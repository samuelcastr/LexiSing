<p align="center">
  <h1 align="center">LexiSing</h1>
  <p align="center">
    Plataforma de comunicación por Lengua de Señas con Inteligencia Artificial
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Angular-20-E34F26?style=for-the-badge&logo=angular&logoColor=white" alt="Angular"/>
    <img src="https://img.shields.io/badge/Django-6.0-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django"/>
    <img src="https://img.shields.io/badge/Firebase-DD2C00?style=for-the-badge&logo=firebase&logoColor=white" alt="Firebase"/>
    <img src="https://img.shields.io/badge/Groq-IA-blueviolet?style=for-the-badge" alt="Groq"/>
    <img src="https://img.shields.io/badge/MediaPipe-green?style=for-the-badge" alt="MediaPipe"/>
  </p>
</p>

---

## Que es LexiSing

LexiSing permite a personas sordomudas comunicarse en tiempo real mediante lengua de señas. La cámara detecta los gestos de la mano usando **MediaPipe HandLandmarker**, los traduce a palabras clave, y una IA (**Groq API**) las convierte en frases gramaticalmente correctas en español formal. Esas frases se envían como mensajes de chat entre usuarios.

---

## Funcionalidades principales

### Deteccion de señas en tiempo real
- **24 gestos** reconocidos (14 unimanuales, 5 bimanuales, 3 de movimiento)
- Suavizado de landmarks en 15 frames, confirmacion con 3 frames consecutivos
- Acumulacion de hasta 15 gestos como "chips" que arman una frase
- Modo practica con visualizacion de gestos detectados

### Formalizacion con IA
- El endpoint `POST /api/text/formalize/` convierte secuencias de glosas en texto formal empresarial usando **Groq API** (modelo `qwen/qwen3.8-27b`)
- Fallback automatico si la IA no esta disponible (une las palabras con espacios)

### Chat y conversaciones
- Conversaciones 1-a-1 entre usuarios con mensajes en tiempo real
- Edicion y eliminacion de mensajes
- Indicador de presencia online/offline

### Autenticacion y usuarios
- Login con email/password, Google y Microsoft via **Firebase Auth**
- Perfiles de usuario con roles (admin, empleado, sordomudo, supervisor, usuario)
- Guards de autenticacion y roles en rutas protegidas

---

## Stack tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Frontend | Angular + TypeScript | 20.3 |
| UI | Angular Material | 20.2 |
| Deteccion de señas | MediaPipe HandLandmarker | 1.0 |
| Backend | Django + DRF | 6.0 + 3.17 |
| Auth | Firebase Authentication | - |
| Base de datos | Firestore (NoSQL) | - |
| IA (formalizacion) | Groq API | - |
| HTTP Client | Requests (Python) / HttpClient (Angular) | - |

---

## Estructura del proyecto

```
LexiSing/
├── back_lexiSing/                    # Backend Django + DRF
│   ├── lexising/                     # Configuracion del proyecto
│   │   ├── settings.py              # Settings (env vars, DRF, CORS)
│   │   └── urls.py                  # Routing principal
│   ├── app/core/                     # Modulo core
│   │   ├── authentication.py        # FirebaseAuthentication (DRF)
│   │   └── firebase.py             # Inicializacion Firebase + Firestore
│   ├── users/                        # App: gestion de usuarios
│   │   ├── views.py                 # APIViews (UserProfile, UsersList)
│   │   └── urls.py                  # Rutas /api/users/, /api/health/
│   ├── text/                         # App: formalizacion de texto con IA
│   │   ├── serializers.py           # Validacion de input (gestos + contexto)
│   │   ├── services.py              # GroqService (llamada a Groq API + fallback)
│   │   ├── views.py                 # TextFormalizeView (POST /api/text/formalize/)
│   │   └── urls.py                  # Ruta del endpoint
│   ├── requirements.txt             # Dependencias Python
│   ├── .env                         # Variables de entorno (GROQ_API_KEY)
│   └── firebase-key.json            # Credenciales Firebase (no commitear)
│
├── front-lexi-sing/                  # Frontend Angular 20
│   └── src/app/
│       ├── core/
│       │   ├── services/
│       │   │   ├── sign-language.service.ts   # Deteccion de señas (MediaPipe)
│       │   │   ├── text-formalizer.service.ts # Llamada a /api/text/formalize/
│       │   │   ├── conversation.service.ts    # CRUD conversaciones (Firestore)
│       │   │   ├── auth.service.ts            # Firebase Auth
│       │   │   └── error.service.ts           # Toast de errores
│       │   ├── models/
│       │   │   └── formalize-response.model.ts
│       │   ├── guards/               # auth.guard, role.guard
│       │   └── interceptors/         # Firebase token interceptor
│       └── features/
│           ├── auth/                  # Login, registro, forgot-password
│           ├── chat/
│           │   └── conversation-list/ # Componente principal de chat + cámara
│           └── dashboard/             # Panel de administracion
```

---

## Endpoints de la API

| Metodo | Endpoint | Auth | Descripcion |
|--------|----------|------|-------------|
| GET | `/api/health/` | No | Health check del backend |
| GET | `/api/users/me/` | Si | Perfil del usuario autenticado |
| GET | `/api/users/` | No | Lista de todos los usuarios |
| GET/POST | `/api/conversations/` | Si | Listar/crear conversaciones |
| POST | `/api/text/formalize/` | Si | Formalizar glosas de señas con IA |

### Ejemplo: Formalizar texto

```bash
curl -X POST http://localhost:8000/api/text/formalize/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -d '{"gestos": ["HOLA", "NECESITO", "AYUDA"], "contexto": "chat de soporte"}'
```

**Respuesta:**
```json
{
  "texto_formal": "Hola, necesito ayuda.",
  "gestos_originales": ["HOLA", "NECESITO", "AYUDA"],
  "fuente": "groq"
}
```

---

## Inicio rapido

### Requisitos
- Python 3.10+
- Node.js 20+ y npm
- Cuenta en [Firebase Console](https://console.firebase.google.com/)
- API key de [Groq Console](https://console.groq.com/) (gratuita)

### Backend

```bash
cd back_lexiSing

# Entorno virtual
python3 -m venv .venv
source .venv/bin/activate

# Dependencias
pip install -r requirements.txt

# Variables de entorno — crear .env con:
echo 'GROQ_API_KEY=gsk_tu_clave_aqui' > .env

# Credenciales Firebase — colocar firebase-key.json en la raiz

# Ejecutar
python manage.py runserver 0.0.0.0:8000
```

### Frontend

```bash
cd front-lexi-sing

# Dependencias
npm install

# Ejecutar
ng serve
```

Frontend: `http://localhost:4200/`
Backend: `http://localhost:8000/`

---

## Como funciona la deteccion de señas

```
Camara (WebRTC)
    │
    ▼
MediaPipe HandLandmarker (client-side)
    │
    ▼
Extrae 21 landmarks por mano
    │
    ▼
Suavizado (3 frames) + Historial (15 frames)
    │
    ▼
Clasificacion de gestos:
  ├─ Bimanuales primero (2 manos)
  ├─ Estáticos (posición de dedos)
  └─ Movimiento (ondeo, apuntar)
    │
    ▼
Confirmacion (3 frames consecutivos del mismo gesto)
    │
    ▼
Chip agregado al array de gestos
    │
    ▼
"Formalizar" → Groq API → Texto formal en español
    │
    ▼
Mensaje enviado en el chat
```

---

## Gestos soportados

| Gesto | Seña | Tipo |
|-------|------|------|
| HOLA | Palma abierta | Unimanual |
| SI | Pulgar arriba | Unimanual |
| NO | Pulgar abajo | Unimanual |
| ADIOS | Indice + medio en V | Unimanual |
| TE_QUIERO | Pulgar + indice + meñique | Unimanual |
| ATENCION | Solo indice arriba | Unimanual |
| GRACIAS | Puño cerrado | Unimanual |
| POR_FAVOR | Indice + medio + anular | Unimanual |
| NECESITO | 4 dedos arriba | Unimanual |
| PERFECTO | Pulgar toca indice | Unimanual |
| LLAMAR | Pulgar + meñique | Unimanual |
| PROMESA | Solo meñique | Unimanual |
| POCO | Pulgar + indice juntos | Unimanual |
| LETRA_L | Pulgar + indice en L | Unimanual |
| LETRA_O | Todas las puntas juntas | Unimanual |
| TRES | Pulgar + indice + medio | Unimanual |
| SEIS | Pulgar + meñique pinza | Unimanual |
| ORACION | Ambas palmas juntas | Bimanual |
| PARAR | Ambas palmas adelante | Bimanual |
| PAZ | Ambas manos en V | Bimanual |
| APLAUSO | Ambas abiertas juntas | Bimanual |
| AMOR | Pulgares + indices juntos | Bimanual |
| ONDEO | Mano de lado a lado | Movimiento |
| MIRA_ARRIBA | Indice apunta arriba | Movimiento |
| MIRA_ABAJO | Indice apunta abajo | Movimiento |

---

## Convenciones de Git

### Ramas
```
main             → Produccion estable
BasesDeDatos     → Base de datos y servicios
develop          → Integracion diaria
feature/<nombre> → Nuevas funcionalidades
```

### Commits
```
feat(scope): descripcion corta
fix(scope): correccion de bug
docs: documentacion
refactor: refactorizacion
```

---

## Equipo

| Nombre | Rol |
|--------|-----|
| **Samuel Castro** | Lider de Proyecto / Backend |
| **Beickert Torres** | Frontend |
| **Cielo Rodriguez** | Frontend |
| **Juan Riveros** | QA / Testing / Base de datos |

---

## Licencia

Proyecto academico - Universidad
