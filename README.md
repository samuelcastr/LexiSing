# LexiSing 🎤

**Proyecto de Aplicación Web para Práctica de Pronunciación en Inglés**

LexiSing es una aplicación web completa que combina tecnologías modernas para crear una plataforma interactiva de aprendizaje de pronunciación en inglés. La aplicación utiliza inteligencia artificial y análisis de audio para proporcionar retroalimentación en tiempo real a los usuarios.

---

## 📋 Contenido

- [Resumen del Proyecto](#resumen-del-proyecto)
- [Estructura del Repositorio](#estructura-del-repositorio)
- [Características Principales](#características-principales)
- [Stack Tecnológico](#stack-tecnológico)
- [Guía de Inicio Rápido](#guía-de-inicio-rápido)
- [Configuración Detallada](#configuración-detallada)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Convenciones de Git](#convenciones-de-git)
- [Equipo de Desarrollo](#equipo-de-desarrollo)

---

## 📖 Resumen del Proyecto

LexiSing es una plataforma educativa diseñada para ayudar a estudiantes de inglés a mejorar su pronunciación. La aplicación:

- **Captura audio** del usuario mientras pronuncia palabras o frases en inglés
- **Analiza la pronunciación** mediante IA y algoritmos de procesamiento de audio
- **Proporciona retroalimentación** detallada sobre la calidad de la pronunciación
- **Gestiona conversaciones** entre usuarios y mentores virtuales
- **Mantiene historial** de progreso del usuario
- **Autentica usuarios** de forma segura con Firebase

### Objetivos:
✅ Mejorar la pronunciación del inglés de forma interactiva  
✅ Proporcionar retroalimentación instantánea y precisa  
✅ Crear una comunidad de aprendizaje colaborativa  
✅ Ofrecer una interfaz amigable e intuitiva  

---

## 🗂️ Estructura del Repositorio

```
LexiSing/
├── back_lexiSing/           # Backend - API REST con Django y DRF
│   ├── app/                 # Aplicación principal
│   │   ├── api/            # Endpoints y routers
│   │   ├── core/           # Configuración, autenticación, Firebase
│   │   ├── crud/           # Operaciones de base de datos
│   │   ├── db/             # Conexión a la base de datos
│   │   ├── models/         # Modelos de datos
│   │   └── schemas/        # Esquemas de validación
│   ├── users/              # Aplicación Django para gestión de usuarios
│   ├── lexising/           # Configuración principal de Django
│   ├── db.sqlite3          # Base de datos local (desarrollo)
│   ├── firebase-key.json   # Claves de autenticación con Firebase
│   ├── manage.py           # Script de gestión de Django
│   ├── requirements.txt    # Dependencias de Python
│   └── README.md           # Documentación del backend
│
├── front-lexi-sing/        # Frontend - Aplicación Angular
│   ├── src/
│   │   ├── app/           # Componentes y servicios principales
│   │   │   ├── core/      # Guards, interceptors, modelos, servicios globales
│   │   │   └── features/  # Módulos de funcionalidades (auth, chat, dashboard)
│   │   ├── environments/  # Configuración de entornos
│   │   ├── main.ts        # Punto de entrada de la aplicación
│   │   └── index.html     # HTML base
│   ├── angular.json        # Configuración de Angular
│   ├── package.json        # Dependencias de Node.js
│   ├── tsconfig.json       # Configuración de TypeScript
│   └── README.md           # Documentación del frontend
│
└── README.md               # Documentación general (este archivo)
```

---

## ⭐ Características Principales

### Backend (Django REST Framework)

1. **Autenticación y Autorización**
   - Integración con Firebase para autenticación segura
   - JWT tokens para autorización de API
   - Guards de autenticación en rutas protegidas

2. **Gestión de Usuarios**
   - Registro de nuevos usuarios
   - Perfiles de usuario personalizables
   - Historial de actividad

3. **API REST**
   - Endpoints versados (`/api/v1/`)
   - Manejo de usuarios, conversaciones y análisis
   - Validación de datos con schemas
   - Respuestas estructuradas con códigos HTTP apropiados

4. **Integración con Firebase**
   - Autenticación de usuarios
   - Almacenamiento de archivos de audio
   - Análisis en tiempo real

### Frontend (Angular)

1. **Módulos de Funcionalidades**
   - **Auth**: Sistema de login y registro
   - **Chat**: Interfaz de conversación con IA
   - **Dashboard**: Panel principal del usuario

2. **Servicios Centralizados**
   - `AuthService`: Gestión de autenticación
   - `UserApiService`: Consumo de API de usuarios
   - `ConversationService`: Gestión de conversaciones
   - `MessagingService`: Manejo de mensajes
   - `BackendService`: Comunicación general con backend

3. **Interceptores y Guards**
   - `AuthGuard`: Protección de rutas
   - `FirebaseTokenInterceptor`: Inyección automática de tokens

4. **Interfaz de Usuario**
   - Componentes reutilizables
   - Estilos SCSS modularizados
   - Servidor renderizado (SSR ready)

---

## 🛠️ Stack Tecnológico

### Backend
- **Python 3.14+**
- **Django 5.x** - Framework web
- **Django REST Framework** - API REST
- **SQLite** (desarrollo) / Base de datos relacional
- **Firebase Admin SDK** - Autenticación y servicios
- **python-decouple** - Gestión de configuración

### Frontend
- **Angular 20.3.27+** - Framework web
- **TypeScript 5.x** - Lenguaje de programación
- **SCSS** - Preprocesador CSS
- **Firebase SDK** - Cliente para Firebase
- **RxJS** - Programación reactiva

### Servicios Externos
- **Firebase** - Autenticación, almacenamiento y base de datos en tiempo real
- **AI/ML** - Análisis de pronunciación (integración pendiente)

---

## 🚀 Guía de Inicio Rápido

### Requisitos Previos
- Python 3.10+
- Node.js 20+ y npm
- Git
- Firebase Account (configurado)

### Iniciar Backend

```bash
# 1. Navegar a la carpeta del backend
cd back_lexiSing

# 2. Crear entorno virtual
python3 -m venv .venv

# 3. Activar entorno virtual
source .venv/bin/activate  # En Linux/Mac
# o en Windows:
# .venv\Scripts\activate

# 4. Instalar dependencias
pip install -r requirements.txt

# 5. Aplicar migraciones de BD
python manage.py migrate

# 6. Ejecutar servidor
python manage.py runserver 0.0.0.0:8000
```

Backend estará disponible en: `http://127.0.0.1:8000/`

### Iniciar Frontend

```bash
# 1. Navegar a la carpeta del frontend
cd front-lexi-sing

# 2. Instalar dependencias
npm install

# 3. Ejecutar servidor de desarrollo
ng serve
# o
npm start
```

Frontend estará disponible en: `http://localhost:4200/`

### Verificar que Todo Funciona

```bash
# Probar backend
curl -sSf http://127.0.0.1:8000/api/v1/health/ || curl http://127.0.0.1:8000/

# El frontend debería cargar en el navegador
```

---

## ⚙️ Configuración Detallada

### Backend - Configuración de Firebase

El archivo `firebase-key.json` es **requerido** para autenticación. Para obtenerlo:

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar el proyecto `LexiSing`
3. Ir a **Project Settings** → **Service Accounts**
4. Click en **Generate New Private Key**
5. Guardar el archivo como `back_lexiSing/firebase-key.json`

### Backend - Base de Datos

```bash
# Ver migraciones pendientes
python manage.py showmigrations

# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario (admin)
python manage.py createsuperuser
```

### Frontend - Entornos

Configurar en `src/environments/`:
- `environment.ts` - Desarrollo
- `environment.prod.ts` - Producción

```typescript
// Ejemplo de configuración
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  firebaseConfig: { ... }
};
```

---

## 🏗️ Arquitectura del Proyecto

### Backend - Arquitectura por Capas

```
back_lexiSing/
├── core/              # Configuración y utilidades
│   ├── authentication.py
│   ├── config.py
│   └── firebase.py
├── models/            # Modelos de datos (ORM)
├── schemas/           # Validación con Pydantic
├── crud/              # Operaciones de BD (Create, Read, Update, Delete)
├── db/                # Configuración de BD
└── api/               # Rutas y endpoints
    └── v1/           # API versión 1
        └── endpoints/
```

**Flujo de una petición:**
1. Cliente → Django URLs
2. URLs → Router → Endpoint
3. Endpoint valida con Schema
4. Schema → CRUD → Modelos
5. Modelos interactúan con BD
6. Respuesta JSON → Cliente

### Frontend - Arquitectura de Componentes

```
src/app/
├── core/              # Servicios, guards, interceptors, modelos
├── features/
│   ├── auth/         # Módulo de autenticación
│   ├── chat/         # Módulo de conversación
│   └── dashboard/    # Módulo principal
└── shared/           # Componentes compartidos
```

**Flujo de una petición:**
1. Componente → Servicio
2. Servicio → HttpClient
3. HttpClient → Interceptor (agrega token)
4. Request → Backend API
5. Respuesta → Guard (autorización)
6. Guard → Componente

---

## 📝 Convenciones de Git

### Ramas

```
main              → Producción (estable)
develop           → Integración para desarrollo diario
feature/<nombre>  → Nuevas funcionalidades
bugfix/<nombre>   → Correcciones de errores
hotfix/<nombre>   → Arreglos urgentes en producción
```

#### Ejemplos Reales:
- `feature/login-usuario`
- `feature/analisis-pronunciacion`
- `bugfix/corregir-inicio-sesion`
- `hotfix/ajuste-deploy`

### Commits

**Formato recomendado:**
```
<tipo>(<alcance>): <descripción corta>

<descripción más detallada opcional>
```

**Tipos permitidos:**
- `feat` - Nueva funcionalidad
- `fix` - Corrección de bug
- `docs` - Documentación
- `style` - Formato/correcciones menores
- `refactor` - Refactorización
- `test` - Pruebas
- `chore` - Tareas de mantenimiento

**Ejemplos:**
```
feat(auth): agregar login con JWT
fix(api): corregir endpoint de usuarios
docs: actualizar README global
refactor(core): optimizar servicio de Firebase
```

### Pull Requests / Merge Requests

- ✅ Título claro y descripción del cambio
- ✅ Referenciar issue/ticket si aplica
- ✅ Mínimo 1 revisión antes de merge
- ✅ No hacer merge directo a `main` sin aprobación
- ✅ Base de PR es `develop` (o rama específica)
- ✅ Actualizar `develop` antes de abrir PR

---

## 👥 Equipo de Desarrollo

| Nombre | Rol | Contacto |
|--------|-----|---------|
| **Samuel Castro** | Líder de Proyecto | samuelcastr |
| **Beickert Torres** | Frontend | beickert |
| **Cielo Rodríguez** | Frontend | cielo |
| **Juan Riveros** | QA/Testing/base de datos | juan |

---

## 🎓 Recursos y Documentación

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Angular Documentation](https://angular.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Git Workflow](https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows)

---

## 📌 Notas Importantes

- **Siempre activar el entorno virtual** antes de trabajar en el backend
- **Actualizar `develop`** antes de crear un nuevo feature
- **No commitear archivos sensibles** como `firebase-key.json` (usar `.gitignore`)
- **Pruebas regulares** del flujo completo backend + frontend
- **Documentar cambios** importantes en los README locales

---

## ✅ Checklist para Nuevos Desarrolladores

- [ ] Clonar el repositorio
- [ ] Configurar Firebase key (`firebase-key.json`)
- [ ] Instalar dependencias del backend (requirements.txt)
- [ ] Instalar dependencias del frontend (npm install)
- [ ] Ejecutar migraciones de BD
- [ ] Verificar que backend responde (`/api/health/`)
- [ ] Verificar que frontend carga en navegador
- [ ] Leer convenciones de Git del proyecto
- [ ] Crear rama de feature para empezar a trabajar


