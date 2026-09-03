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

LexiSing permite a personas sordomudas comunicarse en tiempo real mediante **Lengua de Señas Colombiana (LSC)**. La cámara detecta los gestos de la mano usando **MediaPipe HandLandmarker**, los traduce a palabras clave o letras del abecedario, y una IA (**Groq API**) las convierte en frases gramaticalmente correctas en español formal. Esas frases se envían como mensajes de chat entre usuarios.

---

## Funcionalidades principales

### Deteccion de señas en tiempo real (Lengua de Señas Colombiana)
- **33 señas de palabras** reconocidas (incluye léxico empresarial) + **27 letras** del abecedario dactilológico LSC para deletreo
- Dos modos de reconocimiento: **Palabras** (señas completas) y **Deletreo** (letra por letra)
- Suavizado de landmarks (3 frames), historial de 15 frames y confirmación con 3 frames consecutivos (5 frames en letras ambiguas A/E/M/N/Ñ/O/R/S)
- Acumulación de hasta 15 gestos como "chips" que arman una frase
- Modo práctica con visualización de gestos detectados y retención estricta en letras ambiguas
- Banner de "mano no detectada" cuando se pierde el rastreo por más de 600 ms

### Formalizacion con IA
- El endpoint `POST /api/text/formalize/` convierte secuencias de glosas en texto formal empresarial usando **Groq API** (modelo `qwen/qwen3.8-27b`)
- Fallback automatico si la IA no esta disponible (une las palabras con espacios)

### Chat y conversaciones
- Conversaciones 1-a-1 entre usuarios con mensajes en tiempo real
- Edicion y eliminacion de mensajes
- Indicador de presencia online/offline
- Verificacion de conversaciones duplicadas antes de crear una nueva
- Notificaciones sonoras cuando llega un mensaje en una conversación activa

### Autenticacion y usuarios
- Login con email/password, Google y Microsoft via **Firebase Auth**
- Sesión persistente (`browserLocalPersistence`) que conserva el rol del usuario al recargar
- Perfiles de usuario con roles (admin, empleado, sordomudo, supervisor, usuario)
- Guards de autenticacion y roles en rutas protegidas

### Panel de supervisión (monitoreo)
- Vista de monitoreo de conversaciones con filtros por participante/mensaje/fecha
- Diseño violeta/índigo y tabla con truncado de mensajes largos

---

## Stack tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Frontend | Angular + TypeScript | 20.3 |
| UI | Angular Material | 20.2 |
| Deteccion de señas | MediaPipe HandLandmarker | 1.0 |
| Lengua de señas | LSC (abecedario dactilológico) | 27 letras |
| Backend | Django + DRF | 6.0 + 3.17 |
| Auth | Firebase Authentication | - |
| Base de datos | Firestore (NoSQL) | - |
| IA (formalizacion) | Groq API | - |
| Camara | WebRTC `getUserMedia` | - |
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
│       │   │   ├── sign-language.service.ts   # Deteccion de señas LSC (MediaPipe)
│       │   │   ├── camera.service.ts          # Captura de cámara (getUserMedia)
│       │   │   ├── text-formalizer.service.ts # Llamada a /api/text/formalize/
│       │   │   ├── conversation.service.ts    # CRUD conversaciones (Firestore)
│       │   │   ├── notification.service.ts    # Notificaciones sonoras de chat
│       │   │   ├── presence.service.ts        # Presencia online/offline
│       │   │   ├── activity.service.ts        # Registro de actividad
│       │   │   ├── dashboard.service.ts       # Datos del panel de administracion
│       │   │   ├── user-api.service.ts        # Cliente de las APIs de usuarios
│       │   │   ├── auth.service.ts            # Firebase Auth
│       │   │   └── error.service.ts           # Toast de errores
│       │   ├── models/
│       │   │   └── formalize-response.model.ts
│       │   ├── guards/               # auth.guard, role.guard
│       │   └── interceptors/         # Firebase token interceptor
│       └── features/
│           ├── auth/                  # Login, registro, forgot-password
│           ├── chat/
│           │   └── conversation-list/ # Componente principal de chat + cámara + panel de traducción
│           ├── dashboard/             # Panel de administracion
│           └── roles/                 # Paneles por rol (supervisor, etc.)
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
Camara (WebRTC / getUserMedia)
    │
    ▼
MediaPipe HandLandmarker (client-side)
    │
    ▼
Extrae 21 landmarks por mano (hasta 2 manos)
    │
    ▼
Suavizado (3 frames) + Historial (15 frames)
    │
    ▼
Seleccion de modo:
  ├─ Modo PALABRAS → Clasificacion de señas:
  │     ├─ Bimanuales primero (2 manos)
  │     ├─ Estáticas (posición de dedos)
  │     └─ Movimiento (ondeo, apuntar)
  │
  └─ Modo DELETREAR → Abecedario LSC (27 letras)
        clasificador evaluarLetra() (una mano)
    │
    ▼
Confirmacion (3 frames consecutivos; 5 en letras ambiguas)
    │
    ▼
Modo palabras: chip agregado al array de gestos
Modo deletrear: letra concatenada al texto corrido (botones Espacio/Borrar)
    │
    ▼
"Formalizar" → Groq API → Texto formal en español
    │
    ▼
Mensaje enviado en el chat
```

---

## Señas soportadas

### Modo Palabras — señas del vocabulario LSC y empresarial

| Gesto | Significado | Tipo |
|-------|-------------|------|
| PALMA_ABIERTA | Hola | Unimanual |
| PULGAR_ARRIBA | Sí | Unimanual |
| PULGAR_ABAJO | No | Unimanual |
| VICTORIA | Adiós | Unimanual |
| TE_QUIERO | Te quiero | Unimanual |
| INDICE_ARRIBA | Atención | Unimanual |
| PUÑO_CERRADO | Gracias | Unimanual |
| TRES_DEDOS | Por favor | Unimanual |
| CUATRO_DEDOS | Necesito | Unimanual |
| OK_SIGN | Perfecto | Unimanual |
| PULGAR_MEÑIQUE | Llamar | Unimanual |
| MEÑIQUE_ARRIBA | Promesa | Unimanual |
| PINZA | Poco | Unimanual |
| LETRA_L | Letra L | Unimanual |
| LETRA_O | Letra O | Unimanual |
| NUMERO_3 | Tres | Unimanual |
| NUMERO_6 | Seis | Unimanual |
| ONDEO | Adiós (ondeo) | Movimiento |
| APUNTAR_ARRIBA | Mira arriba | Movimiento |
| APUNTAR_ABAJO | Mira abajo | Movimiento |
| ORACION | Oración | Bimanual |
| PARAR | Parar | Bimanual |
| PAZ | Paz | Bimanual |
| APLAUSO | Aplauso | Bimanual |
| CORAZON | Amor | Bimanual |

### Léxico empresarial (LSC, bimanual)

| Gesto | Significado | Tipo |
|-------|-------------|------|
| REUNION | Reunión | Bimanual |
| INFORME | Informe | Bimanual |
| PAUSA | Pausa | Bimanual |
| APROBAR | Aprobar | Bimanual |
| ENVIAR | Enviar | Bimanual |
| TRABAJAR | Trabajar | Bimanual |
| PEDIR | Pedir | Bimanual |
| CLIENTE | Cliente | (mapeo reservado) |

### Modo Deletreo — abecedario dactilológico LSC (27 letras)

Las letras se detectan con el clasificador `evaluarLetra()` usando una sola mano, y cada confirmación concatena una letra al texto corrido.

| Letra | Configuración manual |
|-------|----------------------|
| A | Puño cerrado, pulgar al costado |
| B | 4 dedos extendidos juntos, pulgar doblado |
| C | 4 dedos curvados formando C |
| D | Índice extendido, otros doblados |
| E | Dedos juntos doblados, pulgar al frente |
| F | Pulgar + índice tocándose, otros arriba |
| G | Índice + pulgar extendidos casi juntos |
| H | Índice + medio extendidos horizontales |
| I | Solo meñique extendido |
| J | Meñique dibuja curva (movimiento) |
| K | Índice + medio, pulgar al frente |
| L | Índice + pulgar en L |
| M | 3 dedos doblados sobre el pulgar |
| N | 2 dedos doblados sobre el pulgar |
| Ñ | N con pulgar en la mejilla |
| O | Todas las yemas juntas (círculo) |
| P | Índice + medio hacia abajo |
| Q | Índice + medio hacia abajo, pulgar debajo |
| R | Índice y medio entrecruzados |
| S | Puño cerrado, pulgar doblado delante |
| T | Índice doblado sobre el pulgar |
| U | Índice + medio juntos |
| V | Índice + medio en V |
| W | Índice + medio + anular arriba |
| X | Índice doblado (gancho) |
| Y | Pulgar + meñique |
| Z | Índice dibuja Z (movimiento) |

> **Nota:** las letras A/E/M/N/Ñ/O/R/S son configuraciones muy similares entre sí; requieren 5 frames de retención para evitar falsos positivos y deben calibrarse con cámara real.

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
