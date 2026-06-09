# ✅ Verificación Fase 1 - Guía Rápida

## 🎯 Verificar Backend está funcionando

### Opción 1: Health Check (sin autenticación)
```bash
curl http://localhost:8000/api/health/
```
**Resultado esperado:**
```json
{"status": "ok", "backend": "LexiSing Django API"}
```

### Opción 2: Revisar logs en consola Django
```
Watching for file changes with StatReloader
Starting development server at http://0.0.0.0:8000/
🔥 Firebase conectado correctamente
```

---

## 🌐 Verificar Frontend está funcionando

1. Abre http://localhost:4200 en navegador
2. Deberías ver pantalla de **Login**
3. Si ves errores en consola, revisa DevTools (F12) → Console

---

## 🔐 Test End-to-End (Funcional)

### Test 1: Registro & Login
1. Haz clic en "Registrarse"
2. Completa:
   - **Email**: `user1@test.com`
   - **Contraseña**: `Test123456`
   - **Nombre**: `Usuario Prueba 1`
3. Haz clic "Registrarse"
4. **Esperado**: Redirección al Dashboard

### Test 2: Verificar Conexión Backend
En DevTools (F12) → Network:
- Abre cualquier endpoint (ej: `/api/conversations`)
- En pestaña "Headers", busca: `Authorization: Bearer eyJhbGciOi...`
- Si ves el token = ✅ Interceptor funciona

### Test 3: Chat en Tiempo Real (Necesitas 2 usuarios)

#### Usuario 1 (Navegador A):
1. Registra: `user1@test.com`
2. Espera a que cargue Dashboard
3. Haz clic en **"Conversaciones"**
4. Haz clic en el botón **+** (abajo derecha)
5. Ingresa UID de Usuario 2 (cópialo desde el paso 6)
6. Haz clic "Crear"
7. Haz clic en la conversación que aparece

#### Usuario 2 (Navegador B - Incógnito):
1. Registra: `user2@test.com`
2. Ve a la consola del navegador y ejecuta:
   ```javascript
   firebase.auth().currentUser.uid
   ```
   Copia el resultado

#### Usuario 1 (Navegador A):
8. En el chat, ingresa: `"Hola desde usuario 1"`
9. Presiona Enter o haz clic enviar

#### Usuario 2 (Navegador B):
10. En **Conversaciones**, debería aparecer la conversación
11. Abrela y verá el mensaje **en tiempo real** (sin refrescar)
12. Responde: `"Hola usuario 1"`

#### Usuario 1 (Navegador A):
13. Verifica que recibiste la respuesta en tiempo real
14. Prueba eliminar tu mensaje (icono 3 puntos → Eliminar)

---

## 🔍 Debugging Rápido

### Error: Token inválido en backend
```
❌ Error validando token: ...
```
**Solución**: 
- Verifica que el usuario esté autenticado en Firebase
- Revisa que `firebase-key.json` está en `/back_lexiSing/`

### Error: CORS en Frontend
```
❌ Access to XMLHttpRequest at 'http://localhost:8000/api/...' 
   from origin 'http://localhost:4200' has been blocked by CORS policy
```
**Solución**:
- Backend tiene CORS habilitado para `http://localhost:4200`
- Recarga la página (Ctrl+F5 o Cmd+Shift+R)

### Chat no sincroniza
```
❌ Los mensajes no aparecen en tiempo real
```
**Solución**:
- Verifica que Firestore está habilitada en Firebase Console
- Usa "Test mode" temporalmente (permite lectura/escritura sin auth)
- Revisa que ambos usuarios están en la misma conversación

---

## 📊 Checklist Final

- [ ] Backend levantado sin errores
- [ ] Frontend carga en http://localhost:4200
- [ ] Health check retorna OK
- [ ] Puedo registrarme con Firebase
- [ ] Puedo iniciar sesión
- [ ] Dashboard se carga correctamente
- [ ] Puedo crear una conversación
- [ ] Puedo enviar mensajes (tiempo real)
- [ ] Puedo recibir mensajes en otra sesión (tiempo real)
- [ ] Puedo eliminar mensajes
- [ ] DevTools → Network muestra token en requests

---

## 🚀 Siguiente: Commits & Push

```bash
# En la raíz del proyecto
git add .
git commit -m "Refactor: UI mejorada dashboard, chat profesional, test guides"
git push origin main
```

---

## 📞 Soporte

Si algo no funciona, revisa:

1. **Backend logs**:
   ```bash
   cd back_lexiSing
   python manage.py runserver --verbosity 2
   ```

2. **Frontend logs** (DevTools):
   - F12 → Console
   - Busca errores en rojo

3. **Firebase Console**:
   - Autenticación activa
   - Firestore creada
   - CORS configurado

4. **Firestore**:
   - Colección `conversaciones` existe
   - Reglas en "Test mode" temporalmente

---

**Versión**: 0.1.0  
**Estado**: Fase 1 - MVP ✅  
**Fecha**: 9 de junio de 2026
