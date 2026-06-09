# LexiSing MVP - Fase 1

**Plataforma inclusiva para comunicación entre personas sordas/mudas y personal de atención al cliente.**

---

## 📋 Requisitos Previos

- **Node.js**: 18+ (descargar de [nodejs.org](https://nodejs.org))
- **Python**: 3.14+ (descargar de [python.org](https://www.python.org))
- **Firebase Proyecto**: Crear en [Firebase Console](https://console.firebase.google.com)
- **Git**: Clonar el repositorio

---

## 🚀 Instalación

### 1. Frontend (Angular)

```bash
cd front-lexi-sing

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (http://localhost:4200)
npm start
```

### 2. Backend (Django + DRF)

```bash
cd back_lexiSing

# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
# En Linux/Mac:
source .venv/bin/activate
# En Windows:
.venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar base de datos (SQLite)
python manage.py migrate

# Iniciar servidor (http://localhost:8000)
python manage.py runserver
```

---

## 🔐 Configuración de Firebase

### Paso 1: Obtener credenciales
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto (o crea uno)
3. Ve a **Configuración del proyecto** → **Cuentas de servicio**
4. Haz clic en **Generar nueva clave privada**
5. Descarga el archivo JSON (renómbralo a `firebase-key.json`)

### Paso 2: Colocar credenciales
- **Backend**: Copia `firebase-key.json` en `/back_lexiSing/firebase-key.json`

### Paso 3: Configurar Authentication en Firebase Console
- Habilita **Email/Password** en Authentication
- Habilita **Google** (opcional)
- Añade `http://localhost:4200` en **Authorized domains**

### Paso 4: Configurar Firestore
1. Crea una base de datos Firestore
2. Usa las siguientes colecciones:
   - `usuarios` (documentos: uid)
   - `conversaciones` (documentos: conversationId)
   - Subcolección `mensajes` dentro de `conversaciones`

---

## 📁 Estructura del Proyecto

```
proyecto_lexiSing/
├── front-lexi-sing/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── models/
│   │   │   │   │   ├── user.model.ts
│   │   │   │   │   └── message.model.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── conversation.service.ts
│   │   │   │   │   ├── backend.service.ts
│   │   │   │   │   └── messaging.service.ts (skeleton)
│   │   │   │   ├── guards/
│   │   │   │   │   └── auth.guard.ts
│   │   │   │   └── interceptors/
│   │   │   │       └── firebase-token.interceptor.ts
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/
│   │   │   │   │   └── register/
│   │   │   │   ├── dashboard/
│   │   │   │   └── chat/
│   │   │   │       ├── conversation-list/
│   │   │   │       └── chat/
│   │   │   ├── app.config.ts
│   │   │   └── app.routes.ts
│   │   ├── environments/
│   │   │   ├── environment.ts
│   │   │   └── environment.prod.ts
│   │   └── main.ts
│   ├── package.json
│   └── angular.json
│
├── back_lexiSing/
│   ├── app/
│   │   ├── core/
│   │   │   ├── firebase.py
│   │   │   └── authentication.py
│   │   ├── crud/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── users/
│   │   ├── views.py (endpoints MVP)
│   │   ├── urls.py (rutas)
│   │   └── admin.py
│   ├── lexising/
│   │   ├── settings.py (CORS, DRF config, Firebase)
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── manage.py
│   ├── db.sqlite3
│   └── requirements.txt
│
└── README.md
```

---

## 🔌 Endpoints MVP

### Health Check
- **GET** `/api/health/` → Check backend status

### Users (autenticados con Firebase Token)
- **GET** `/api/users/me/` → Obtener perfil del usuario
- Requiere header: `Authorization: Bearer <ID_TOKEN>`

### Conversations (autenticados con Firebase Token)
- **GET** `/api/conversations/` → Listar conversaciones del usuario
- **POST** `/api/conversations/` → Crear conversación
- Requiere header: `Authorization: Bearer <ID_TOKEN>`

---

## ✅ Cómo Probar la Fase 1

### Test 1: Registrar e iniciar sesión
1. Abre http://localhost:4200 en navegador
2. Haz clic en **Registrarse**
3. Completa formulario (email/password)
4. Verifica que se redirige al Dashboard

### Test 2: Verificar Firebase Auth
1. Backend obtiene `firebase-key.json` correctamente
2. En Firebase Console, verifica que el usuario aparece en Authentication

### Test 3: Crear conversación
1. En Dashboard, haz clic en **Conversaciones**
2. Debería cargar lista (vacía inicialmente)
3. Abre Firestore Console y verifica que la colección existe

### Test 4: Chat en tiempo real
1. Abre dos navegadores (o incognito): usuario A y B
2. Usuario A crea conversación con B
3. Usuario A envía mensaje
4. Usuario B recibe en tiempo real (sin refrescar)
5. Usuario A puede eliminar su mensaje

### Test 5: Endpoints backend
```bash
# Health check
curl http://localhost:8000/api/health/

# Obtener usuario (requiere token valido de Firebase)
curl -H "Authorization: Bearer <ID_TOKEN>" http://localhost:8000/api/users/me/

# Listar conversaciones
curl -H "Authorization: Bearer <ID_TOKEN>" http://localhost:8000/api/conversations/
```

---

## 📊 Checklist de Validación - Fase 1 (25%)

### Frontend
- [x] Angular proyecto creado
- [x] Routing configurado
- [x] Angular Material integrado
- [x] Firebase Authentication configurado
- [x] Login/Registro funcionales
- [x] Dashboard protegido con guard
- [x] Conversaciones (lista + chat)
- [x] Chat en tiempo real (suscripción Firestore)
- [x] Mensajes con opción de eliminar
- [x] Interceptor para agregar token Firebase al backend

### Backend
- [x] Django proyecto creado
- [x] DRF instalado
- [x] Firebase Admin SDK configurado
- [x] Autenticación con tokens Firebase (`FirebaseAuthentication`)
- [x] CORS habilitado
- [x] Endpoints MVP (health, users/me, conversations)
- [x] Protección de endpoints con autenticación

### Integración
- [x] Frontend → Firebase Authentication funcionando
- [x] Frontend → Firestore (conversaciones y mensajes en tiempo real)
- [x] Frontend → Backend (interceptor agrega tokens)
- [x] Backend valida tokens Firebase
- [x] Backend expone endpoints protegidos

### Infra & CI
- [x] CI/CD workflow (GitHub Actions) para build y tests
- [x] README con instrucciones completas

---

## 🐛 Troubleshooting

### Error: "firebase-key.json no encontrado"
```bash
# Solución: Copia el archivo en back_lexiSing/
cp ruta/a/tu/firebase-key.json back_lexiSing/firebase-key.json
```

### Error: "Token inválido" en backend
```
Verifica que:
1. El token se obtiene de Firebase Authentication (AUTH)
2. El header Authorization tiene formato: Bearer <ID_TOKEN>
3. El firebase-key.json en backend es válido
```

### Error: CORS en frontend
```
Backend settings.py tiene CORS_ALLOWED_ORIGINS configurado.
Asegúrate de que el frontend se ejecuta en http://localhost:4200
```

### Chat no sincroniza en tiempo real
```
Verifica que:
1. Firestore está habilitada en Firebase Console
2. Las reglas de Firestore permiten lectura/escritura (test mode inicial)
3. Los usuarios están en la misma conversación
```

---

## 📝 Notas de Diseño

### Firestore Data Model (MVP)
```
conversaciones/{convId}
  - participants: string[]
  - lastMessage: string
  - updatedAt: Timestamp

conversaciones/{convId}/mensajes/{msgId}
  - senderUid: string
  - content: string
  - timestamp: Timestamp
  - read: boolean
```

### Autenticación (Fase 1)
- **Frontend**: Firebase Authentication (Email/Password, Google)
- **Backend**: Valida ID token Firebase
- **Storage**: Usuarios y conversaciones en Firestore

### Tiempo Real
- Firebase Firestore listeners (`onSnapshot`, `collectionData`)
- Sin necesidad de backend en tiempo real (serverless)

---

## 🚀 Próximas Fases

- **Fase 2**: Autenticación completa (recuperación de contraseña, roles)
- **Fase 3**: Mensajería avanzada (tipeo en vivo, reacciones, estado de lectura)
- **Fase 4**: Notificaciones push (FCM)
- **Fase 5**: Tiempo real con estado de presencia
- **Fase 6**: Traducción de lenguaje de señas (MediaPipe + TensorFlow)

---

## 📧 Soporte

Para reportar issues o sugerencias, abre un issue en GitHub.

---

**Versión**: 0.1.0 (MVP Fase 1)  
**Última actualización**: 9 de junio de 2026
