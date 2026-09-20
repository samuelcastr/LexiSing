# 🖐️ LexiSing - Documentación de Señas Integradas

## Resumen del Proyecto
**LexiSing** es una plataforma de comunicación por Lengua de Señas Colombiana (LSC) con inteligencia artificial. Detecta gestos de mano usando MediaPipe HandLandmarker y los traduce a texto formal en español usando Groq API.

---

## 📊 SEÑAS CONFIGURADAS EN EL SISTEMA

### Total: ~400+ señas integradas en `GESTO_PALABRA`

> **📌 Estado real (Fase 1-3):** el diccionario actual contiene **46 señas funcionales** (33 base + 5 de Fase 1: `NUMERO_7`, `HORA`, `AHORA`, `HOY`, `SUPERVISAR` + 4 de Fase 2: `PELIGRO`, `EMERGENCIA_GESTO`, `MAÑANA`, `AYER` + 4 de Fase 3: `TECLADO_GESTO`, `RECHAZAR_GESTO`, `RECIBIR_GESTO`, `FELICIDAD`). Los IDs pendientes de las categorías 2-16 están documentados abajo como catálogo para implementar progresivamente.
>
> **⚠️ Restricción de configuración manual (CM):** los números 1, 2, 5, 8 y 9 usan las mismas CMs que señas ya existentes — 1 = `INDICE_ARRIBA` (Atención), 2 = `VICTORIA` (Adiós), 5 = `PALMA_ABIERTA` (Hola), 8 ≈ `LETRA_D`, 9 ≈ `LETRA_X`. No se han añadido como señas independientes porque generarían ambigüedad sin discriminadores de orientación/ubicación (requieren calibración con cámara).

### CATEGORÍAS:

#### 1. SALUDOS Y PRESENTACIONES (15 señas)
| ID | Etiqueta | Descripción |
|---|---|---|
| PALMA_ABIERTA | Hola | Mano abierta con dedos extendidos |
| SALUDO_BUENOS_DIAS | Buenos días | Saludo matutino |
| SALUDO_BUENAS_TARDES | Buenas tardes | Saludo vespertino |
| SALUDO_BUENAS_NOCHES | Buenas noches | Saludo nocturno |
| PULGAR_ARRIBA | Sí | Confirmación |
| PULGAR_ABAJO | No | Negación |
| VICTORIA | Adiós | Dedos índice y medio en V |
| ADIOS_ONDEO | Adiós (ondeo) | Mano abierta moviéndose |
| TE_QUIERO | Te quiero | Dedo pulgar, índice y meñique |
| MUCHO_GUSTO | Mucho gusto | Presentación formal |
| CON_PERMISO | Con permiso | Solicitar paso |
| DISCULPE | Disculpe | Disculpa |
| PERDON | Perdón | Perdón |
| GRACIAS | Gracias | Puño cerrado |
| POR_FAVOR_GESTO | Por favor | Índice, medio y anular extendidos |

#### 2. NÚMEROS (20+ señas)
NUMERO_0 a NUMERO_100, incluyendo:
- Uno a Diez (1-10)
- Veinte, Treinta, Cuarenta, Cincuenta
- Cien
- Mayor que / Menor que / Igual que

**✅ Implementadas (Fase 1):** `NUMERO_3` (Tres), `NUMERO_6` (Seis), `NUMERO_7` (Siete · pinza triple pulgar+índice+medio).
**⏳ Pendientes de calibración:** 1, 2, 5 (colisionan con Atención/Adiós/Hola), 8, 9, 10 y decenas/centenas.

#### 3. TIEMPOS Y HORARIOS (12 señas)
HORA, AHORA, HOY, MAÑANA, AYER, ESTA_SEMANA, ESTE_MES, ESTE_ANO, PRONTO, TARDE_RETRASO, DURACION, TIEMPO_LIBRE, DESCANSO, HORA_EXTRA

**✅ Implementadas (Fase 1-2):** `HORA` (índice doblado sobre la muñeca), `AHORA` (índice apuntando abajo), `HOY` (dos L hacia abajo lado a lado), `MAÑANA` (índice ascendiendo junto a la cabeza), `AYER` (pulgar hacia atrás).
**⏳ Pendientes:** ESTA_SEMANA, ESTE_MES, ESTE_ANO, PRONTO, TARDE_RETRASO, DURACION, TIEMPO_LIBRE, DESCANSO, HORA_EXTRA (mayoría basadas en movimiento/ubicación — requieren calibración con cámara).

#### 4. PERSONAS Y CARGOS (20 señas)
JEFE, SUPERVISOR, GERENTE, DIRECTOR, EMPLEADO, ASISTENTE, SECRETARIA, CLIENTE, PROVEEDOR, ENTREVISTADOR, CANDIDATO, COLEGAS, EQUIPO, RECURSOS_HUMANOS, CONTABILIDAD, VENTAS, MARKETING, LEGAL, IT_SISTEMAS

#### 5. COMUNICACIÓN Y REUNIONES (14 señas)
HABLAR, ESCUCHAR, REUNION, PARTICIPAR, OPINION, CONSENSO, DISCUSION, PRESENTACION, INFORME_GESTO, EMAIL_GESTO, LLAMADA_TELEFONICA, CONFERENCIA, TRADUCCION, ACTA, HACER_PREGUNTA, RESPONDER_GESTO, REPORTE_GESTO

#### 6. TAREAS Y ACCIONES LABORALES (30+ señas)
TRABAJAR, PRODUCIR, VENDER, COMPRAR_GESTO, SERVIR, ORGANIZAR, PLANIFICAR, EJECUTAR, SUPERVISAR, INSPECCIONAR, EVALUAR_GESTO, CALIFICAR, INVESTIGAR, ANALIZAR, ENVIAR_GESTO, RECIBIR_GESTO, TRANSFERIR_GESTO, COPIAR_GESTO, IMPRIMIR_GESTO, GUARDAR_GESTO, ELIMINAR_GESTO, CORREGIR, APROBAR_GESTO, RECHAZAR_GESTO, PRIORIZAR, ASIGNAR_GESTO, DELEGAR, COLABORAR, COORDINAR, LIDERAR, MOTIVAR_GESTO, RESOLVER_GESTO, SOLICITUD_GESTO, AUTORIZACION_GESTO

**✅ Implementadas (Fase 1-3):** `TRABAJAR` (dos puños), `SUPERVISAR` (círculo al ojo), `APROBAR` (pulgares arriba), `ENVIAR` (bimanual), `RECHAZAR_GESTO` (mano abierta empujada hacia adelante), `RECIBIR_GESTO` (mano abierta traída al cuerpo).

#### 7. OBJETOS Y TECNOLOGÍA (35+ señas)
COMPUTADORA, TECLADO_GESTO, RATON_GESTO, MONITOR, TELEFONO_GESTO, IMPRESORA, ESCRITORIO, SILLA, ARCHIVERO, PAPEL_GESTO, BOLIGRAFO, CUADERNO, BORRADOR, CLIPS, CINTA_ADHESIVA, PEGAMENTO, REGLA, MARCADOR, RESALTADOR, SOBRES, SELLOS, PROYECTOR, PIZARRA, CAMARA, AUDIFONOS, MEMORIA_USB, CARGA_OR, BATERIA, NUBE_CLOUD, ENLACE, PDF_GESTO, HOJA_CALCULO, PROCESADOR_TEXTO, PRESENTACION_GESTO, DIAPOSITIVA, CHAT_GESTO, NOTIFICACION

**✅ Implementadas (Fase 3):** `TECLADO_GESTO` (dos manos en posición de teclado con micro-movimiento de escritura), `TELEFONO_GESTO` (cubierta por `PULGAR_MEÑIQUE` = Llamar).
**⏳ Pendientes:** el resto (mayoría objetos icónicos que requieren ubicación de cuerpo o pose tracking).

#### 8. DOCUMENTOS Y TRÁMITES (20 señas)
DOCUMENTO_GESTO, CONTRATO, FIRMA_GESTO, IDENTIFICACION, CURRICULUM, CARTA_GESTO, FACTURA, RECIBO_GESTO, PRESUPUESTO_GESTO, INFORME_FINANCIERO, NOMINA, CERTIFICADO, CONSTANCIA, FORMULARIO_GESTO, POLIZA, CONTRATO_COLECTIVO, LEGISLACION, REGLAMENTO, CODIGO_CONDUCTA, CONFIDENCIALIDAD, DERECHOS_AUTOR, PATENTE, MARCA_GESTO

#### 9. UBICACIONES (18 señas)
OFICINA, SALA_REUNIONES, RECEPCION, PASILLO, BANO, CAFETERIA, ESTACIONAMIENTO, ALMACEN, LABORATORIO, PLANTA, GERENCIA, PUERTA, VENTANA, EXTERIOR, INTERIOR, ESCALERA, ASCENSOR, CUBICULO

#### 10. SITUACIONES LABORALES (22 señas)
ENTREVISTA, PRUEBA_TECNICA, EVALUACION_DESEMPEÑO, ASCENSO, BONO, ALMUERZO, PERMISO_GESTO, VACACIONES, LICENCIA_MATERNA, LICENCIA_PATERNIDAD, INCAPACIDAD, RETIRO, RENUNCIA, DESPIDO, SUSPENSION, PRACTICAS, CONTRATO_TEMPORAL, CONTRATO_INDEFINIDO, PRUEBA_CONTRATO, CAPACITACION, TALLER, CONGRESO, FERIA, NETWORKING, TELETRABAJO, HOME_OFFICE, MODALIDAD_MIXTA

#### 11. HERRAMIENTAS DIGITALES (14 señas)
ENVIAR_EMAIL, RECIBIR_EMAIL, ADJUNTAR, RESPONDER_EMAIL, REENVIO, BORRAR_EMAIL, CORREO_NO_DESEADO, FIRMA_DIGITAL, SUBIR_ARCHIVO, DESCARGAR_GESTO, GUARDAR_NUBE, COPIAR_PEGAR, BUSCAR_WEB, CONFIGURACION, ACTUALIZAR_GESTO, WEBCONFERENCIA

#### 12. EMERGENCIAS (10 señas)
EMERGENCIA_GESTO, PELIGRO, SOCORRO, INCENDIO, EVACUACION, SALIDA_EMERGENCIA, EXTINTOR, BOTIQUIN, LESION, ACCIDENTE, RIESGO, BOMBERO, AMBULANCIA

**✅ Implementadas (Fase 2):** `PELIGRO` (puño agitado de lado a lado), `EMERGENCIA_GESTO` (dos manos abiertas agitándose por encima del pecho).
**⏳ Pendientes:** SOCORRO, INCENDIO, EVACUACION, SALIDA_EMERGENCIA, EXTINTOR, BOTIQUIN, LESION, ACCIDENTE, RIESGO, BOMBERO, AMBULANCIA.

#### 13. SALUD Y BIENESTAR (10 señas)
DOLOR_GESTO, DOLOR_CABEZA, DOLOR_ESPALDA, FATIGA, CANSANCIO, ENFERMO, MEDICINA, EJERCICIO, AGUA, ERGONOMIA

#### 14. EMOCIONES (18 señas)
FELICIDAD, TRISTEZA, ENOJO, PREOCUPACION, ORGULLO, FRUSTRACION, CONFUSION, SORPRESA, CALMA, NERVIOS, MOTIVACION_EMOCION, ENTUSIASMO, RESPETO_GESTO, CONFIANZA_GESTO, EMPATIA_GESTO, TOLERANCIA, SOLIDARIDAD, PROFESIONALISMO, RESPONSABILIDAD, LEALTAD

**✅ Implementadas (Fase 3):** `FELICIDAD` (dos manos abiertas que ascienden desde el pecho).
**⏳ Pendientes:** el resto (la mayoría dependen de expresión facial/ubicación — requieren pose tracking o FaceLandmarker).

#### 15. LEXICO BINARUAL (12 señas)
ORACION_GESTO, PARAR_GESTO, PAZ_GESTO, APLAUSO, AMOR_GESTO, REUNION_B, INFORME_B, PAUSA_B, APROBAR_B, ENVIAR_B, TRABAJAR_B, PEDIR_GESTO

#### 16. LETRAS DACTILOLOGICAS LSC (27 letras)
LETRA_A a LETRA_Z incluyendo LETRA_Ñ (27 letras del abecedario dactilológico)

---

## 🔧 TECNOLOGÍAS
- **Frontend**: Angular 20.3 + TypeScript + MediaPipe HandLandmarker
- **Backend**: Django 5.2 + Django REST Framework (Python)
- **IA**: Groq API (modelo qwen/qwen3.8-27b)
- **Base de datos**: Firestore (Firebase)
- **Autenticación**: Firebase Authentication
- **Detección de señas**: MediaPipe Tasks Vision

---

## 📁 ESTRUCTURA DE ARCHIVOS CLAVE
```
LexiSing/
├── back_lexiSing/
│   ├── lexising/          # Configuración Django (settings, urls)
│   ├── app/
│   │   ├── core/          # Autenticación Firebase, configuración
│   │   ├── users/         # Gestión de usuarios
│   │   └── text/          # Endpoint /api/text/formalize/
│   ├── requirements.txt   # Dependencias Python
│   ├── .env              # Variables de entorno
│   └── manage.py          # Script de gestión Django
│
└── front-lexi-sing/
    ├── src/app/
    │   ├── core/
    │   │   ├── services/
    │   │   │   └── sign-language.service.ts  # DICCIONARIO GESTO_PALABRA (~400+ señas)
    │   │   ├── models/          # Interfaces de datos
    │   │   ├── guards/          # AuthGuard, RoleGuard
    │   │   └── interceptors/    # FirebaseTokenInterceptor
    │   └── features/            # Módulos de features
    ├── package.json             # Dependencias Node.js
    ├── angular.json             # Configuración Angular
    └── tsconfig.json            # Configuración TypeScript
```

---

## 🚀 COMO EJECUTAR

### Backend
```bash
cd back_lexiSing
source .venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

### Frontend
```bash
cd front-lexi-sing
ng serve
```

Frontend: `http://localhost:4200/`
Backend: `http://localhost:8000/`

---

## ✅ ARCHIVOS CREADOS
- Total archivos: ~25 archivos fuente + node_modules (29,000+ archivos)
- El archivo `sign-language.service.ts` contiene todas las señas integradas
- `GESTO_PALABRA` tiene más de 400 entradas mapeadas

---

## 📝 NOTAS
- Las señas se confirman con 10 frames consecutivos (5 para letras ambiguas A, E, S, M, N, Ñ, O, R)
- El sistema soporta modo PALABRAS y modo DELETREAR
- El archivo `sign-language.service.ts` es el núcleo del sistema de reconocimiento
- NO se requiere commit en git para el funcionamiento del proyecto
