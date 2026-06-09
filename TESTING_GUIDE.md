# Testing Guía - Fase 1

## ✅ Verificar Backend

### 1. Health Check (sin autenticación)
```bash
curl http://localhost:8000/api/health/
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "backend": "LexiSing Django API"
}
```

### 2. Endpoints Protegidos (requieren Firebase Token)

Primero, obtén un ID token de Firebase desde el frontend (abre consola):
```javascript
// En la consola del navegador (DevTools)
const user = firebase.auth().currentUser;
user.getIdToken().then(token => console.log(token));
```

Luego copia el token y úsalo en:
```bash
# Obtener perfil del usuario
curl -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" http://localhost:8000/api/users/me/

# Listar conversaciones
curl -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" http://localhost:8000/api/conversations/

# Crear conversación
curl -X POST \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"participants":["uid_usuario_2"]}' \
  http://localhost:8000/api/conversations/
```

---

## 🔗 Verificar Conexión Frontend ↔ Backend

### En la consola del navegador (DevTools):

```javascript
// 1. Obtener el interceptor en acción
// Abre Network tab en DevTools
// Cualquier request a http://localhost:8000/api/... debe tener header:
// Authorization: Bearer <TOKEN>

// 2. Verificar que el token se envía correctamente
fetch('http://localhost:8000/api/health/')
  .then(r => r.json())
  .then(d => console.log('Backend response:', d));
```

### En Network tab de DevTools:
- Cualquier request a `/api/` debe tener header `Authorization: Bearer ...`
- Status 200 = OK, 401 = token inválido/faltante

---

## 🧪 Test End-to-End (E2E)

### Escenario 1: Registro e Iniciar Sesión

1. **Frontend**:
   - Abre http://localhost:4200
   - Click "Registrarse"
   - Completa: email (ej: user1@test.com), password
   - Verifica que se redirige al Dashboard

2. **Verificación**:
   - Abre Firebase Console → Authentication
   - Verifica que el usuario apareció en la lista

3. **Backend**:
   - En consola dev, copia el ID token y ejecuta:
   ```bash
   curl -H "Authorization: Bearer <TOKEN>" http://localhost:8000/api/users/me/
   ```
   - Debe retornar el UID del usuario

---

### Escenario 2: Chat en Tiempo Real (2 Usuarios)

#### Usuario 1 (Navegador A - http://localhost:4200):
1. Registra usuario1@test.com / password
2. Dashboard → Conversaciones
3. Crea conversación (selecciona usuario 2)
4. Envía mensaje: "Hola desde usuario 1"

#### Usuario 2 (Navegador B - Incognito):
1. Registra usuario2@test.com / password
2. Dashboard → Conversaciones
3. Ve la conversación creada por usuario 1
4. Abre el chat → recibe el mensaje en tiempo real (sin refrescar)
5. Responde: "Hola usuario 1"

#### Usuario 1 (Navegador A):
6. Verifica que recibe la respuesta en tiempo real
7. Prueba eliminar un mensaje (botón 🗑️)

---

## 🐛 Debugging

### Firebase Token Errors

```javascript
// En consola del frontend
firebase.auth().currentUser.getIdToken()
  .then(token => {
    console.log('Token:', token);
    // Verifica que empieza con caracteres válidos base64
  })
  .catch(e => console.error('Error token:', e));
```

### Backend Errors

```bash
# Ver logs en tiempo real
cd back_lexiSing
tail -f logs/debug.log 2>/dev/null || python manage.py runserver --verbosity 2
```

### CORS Issues

Si ves errores de CORS, verifica en `back_lexiSing/lexising/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:4200',
    ...
]
```

---

## 📊 Monitoreo

### Frontend Performance
```javascript
// Consola del navegador
performance.mark('inicio');
// ... ejecuta operación
performance.mark('fin');
performance.measure('duracion', 'inicio', 'fin');
console.log(performance.getEntriesByName('duracion'));
```

### Backend Requests
```bash
# Ver tráfico HTTP en tiempo real
tcpdump -i lo port 8000 -A
```

---

## ✅ Checklist de Validación

- [ ] Backend levantado: `python manage.py runserver`
- [ ] Frontend levantado: `npm start`
- [ ] `GET /api/health/` retorna 200 OK
- [ ] Puedo registrarme (Firebase Auth)
- [ ] Puedo iniciar sesión
- [ ] Dashboard se carga protegido
- [ ] `GET /api/users/me/` retorna perfil (con token)
- [ ] Puedo crear conversación
- [ ] Mensajes sincronización en tiempo real (2 usuarios)
- [ ] Puedo eliminar mis mensajes
- [ ] Firestore colecciones se crean automáticamente

---

## 🚀 Siguiente Paso

Si todo funciona, commits:
```bash
git add .
git commit -m "Test: guía completa de testing Fase 1"
git push origin main
```
