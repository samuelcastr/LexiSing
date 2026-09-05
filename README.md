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

Pon la mano frente a la cámara y mantén la posición unos segundos hasta que la seña se confirme. "Extendido" significa que el dedo queda recto; "doblado/cerrado" significa que se encoge hacia la palma.

| Significado | Cómo se hace la seña | Dedos usados | Tipo |
|-------------|----------------------|--------------|------|
| **Hola** | Mano abierta con todos los dedos extendidos y separados, palma mirando a la cámara | 4 dedos + pulgar abiertos | Unimanual |
| **Sí** | Puño cerrado con el pulgar levantado hacia arriba | Nada + pulgar arriba | Unimanual |
| **No** | Puño cerrado con el pulgar apuntando hacia abajo | Nada + pulgar abajo | Unimanual |
| **Adiós** | Solo los dedos índice y medio extendidos formando una "V" | Índice + medio | Unimanual |
| **Te quiero** | Coloca dedos en la mano del amor: índice y meñique extendidos con el pulgar abierto | Pulgar + índice + meñique | Unimanual |
| **Atención** | Solo el índice extendido hacia arriba, el resto cerrado | Índice | Unimanual |
| **Gracias** | Mano cerrada en puño (sin moverla) | Ninguno | Unimanual |
| **Por favor** | Índice, medio y anular extendidos, meñique y pulgar cerrados | Índice + medio + anular | Unimanual |
| **Necesito** | Los 4 dedos extendidos hacia arriba, pulgar cerrado | Índice + medio + anular + meñique | Unimanual |
| **Perfecto** | Señal de "OK": pulgar y dedo índice se tocan formando un círculo, el resto levantado | Pulgar toca índice | Unimanual |
| **Llamar** | Como la seña del celular: pulgar y meñique extendidos (en forma de teléfono) | Pulgar + meñique | Unimanual |
| **Promesa** | Solo el meñique extendido hacia arriba, resto cerrado | Meñique | Unimanual |
| **Poco** | Pulgar e índice se tocan por las puntas (pellizco pequeño) | Pulgar + índice juntos | Unimanual |
| **Letra L** | Índice y pulgar extendidos formando una "L" (dedos en ángulo de 90°) | Pulgar + índice en L | Unimanual |
| **Letra O** | Todas las puntas de los dedos se tocan formando un círculo | 5 puntas juntas | Unimanual |
| **Tres** | Pulgar, índice y medio extendidos, resto cerrado | Pulgar + índice + medio | Unimanual |
| **Seis** | Puño cerrado con pulgar y meñique extendidos haciendo pinza | Pulgar + meñique | Unimanual |
| **Adiós (ondeo)** | Mano abierta moviéndose de lado a lado | Todos abiertos (con movimiento) | Movimiento |
| **Mira arriba** | Índice extendido apuntando hacia arriba | Índice (con movimiento) | Movimiento |
| **Mira abajo** | Índice extendido apuntando hacia abajo | Índice (con movimiento) | Movimiento |

**Señas de palabras con las dos manos (bimanuales):**

| Significado | Cómo se hace la seña | Tipo |
|-------------|----------------------|------|
| **Oración** | Las dos palmas abiertas se juntan frente a ti | Bimanual |
| **Parar** | Las dos palmas abiertas hacia adelante, separadas (señal de alto) | Bimanual |
| **Paz** | Las dos manos en forma de "V" (victoria) frente a ti | Bimanual |
| **Aplauso** | Las dos palmas abiertas se chocan (como aplaudir) | Bimanual |
| **Amor** | Pulgares e índices de ambas manos se tocan formando un corazón | Bimanual |

### Léxico empresarial (señas de trabajo, con las dos manos)

| Significado | Cómo se hace la seña | Tipo |
|-------------|----------------------|------|
| **Reunión** | Ambas manos planas (4 dedos juntos, pulgar pegado) frente a frente a la misma altura | Bimanual |
| **Informe** | Ambas manos planas, una encima de la otra (como sosteniendo un documento) | Bimanual |
| **Pausa** | Ambas manos en "T": índice y medio extendidos cruzados en vertical (señal de pausa) | Bimanual |
| **Aprobar** | Los dos pulgares levantados hacia arriba a la vez | Bimanual |
| **Enviar** | Ambas palmas abiertas, una claramente más arriba que la otra | Bimanual |
| **Trabajar** | Ambos puños cerrados juntos, uno frente al otro | Bimanual |
| **Pedir** | Una palma abierta y la otra cerrada, cerca una de la otra | Bimanual |
| **Cliente** | *(mapeo reservado para futura seña)* | — |

### Modo Deletreo — abecedario dactilológico LSC (27 letras)

Para **deletrear** una palabra: activa el modo Deletreo, forma cada letra con una mano y mantenla unos segundos; el texto se escribe letra por letra. Usa los botones **Espacio** y **Borrar** del panel para separar palabras o corregir.

| Letra | Cómo se hace la seña | Dedos usados |
|-------|----------------------|--------------|
| **A** | Puño cerrado con el pulgar descansando al costado | Ninguno |
| **B** | Mano abierta con los 4 dedos juntos y rectos, pulgar doblado hacia la palma | 4 dedos juntos |
| **C** | Dedos curvados hacia adelante formando una "C" con el pulgar abierto | 4 dedos curvados + pulgar |
| **D** | Solo el índice extendido, los demás doblados y el pulgar apoyado en el medio | Índice |
| **E** | Dedos doblados y juntos apuntando al pulgar (como un puño con los nudillos visibles) | 4 dedos juntos + pulgar |
| **F** | Pulgar e índice se tocan en punta, los otros 3 dedos levantados | Pulgar + índice; otros arriba |
| **G** | Índice y pulgar extendidos hacia adelante casi tocándose | Pulgar + índice |
| **H** | Índice y medio extendidos tocándose, forma horizontal | Índice + medio |
| **I** | Solo el meñique extendido, el resto cerrado | Meñique |
| **J** | Como la I pero el meñique traza una curva (con movimiento) | Meñique (movimiento) |
| **K** | Índice y medio extendidos con el pulgar apoyado al frente | Índice + medio + pulgar |
| **L** | Índice y pulgar extendidos formando una "L" | Pulgar + índice en L |
| **M** | Los tres primeros dedos doblados sobre el pulgar, meñique cerrado | 3 dedos doblados |
| **N** | Los dos primeros dedos doblados sobre el pulgar | 2 dedos doblados |
| **Ñ** | Igual que la N, con el pulgar tocando la mejilla | 2 dedos doblados + mejilla |
| **O** | Las 5 puntas de los dedos se juntan formando un círculo | 5 puntas juntas |
| **P** | Índice y medio extendidos hacia abajo, pulgar hacia adelante | Índice + medio |
| **Q** | Índice y medio hacia abajo con el pulgar debajo | Índice + medio + pulgar |
| **R** | Índice y medio extendidos y entrecruzados | Índice + medio cruzados |
| **S** | Puño cerrado con el pulgar doblado por delante de los dedos | Ninguno |
| **T** | Índice doblado sobre el pulgar, resto cerrado | Índice |
| **U** | Índice y medio extendidos y juntos | Índice + medio |
| **V** | Índice y medio extendidos separados formando la "V" | Índice + medio en V |
| **W** | Índice, medio y anular extendidos | Índice + medio + anular |
| **X** | Índice doblado como un gancho, resto cerrado | Índice |
| **Y** | Pulgar y meñique extendidos (como el gesto de "llamada") | Pulgar + meñique |
| **Z** | Índice extendido trazando la forma de una Z (con movimiento) | Índice (movimiento) |

> **Nota:** las letras **A, E, S, M, N, Ñ, O, R** son configuraciones de mano muy parecidas entre sí. Por eso el sistema retiene la seña durante 5 frames consecutivos (en lugar de 3) antes de confirmarlas, para reducir errores. Para mejor precisión conviene probar y calibrar con la cámara real.

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
