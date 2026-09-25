# 🖐️ LexiSing - Catálogo de Señas para Conversación Laboral (LSC)

## Resumen del Proyecto
**LexiSing** es una plataforma de comunicación por **Lengua de Señas Colombiana (LSC)** con inteligencia artificial. Detecta gestos de mano con MediaPipe (`Hand Landmarker`) y los traduce a texto formal en español con Groq API.

---

## 📊 ESTADO DEL SISTEMA

| Métrica | Valor |
|---|---|
| Catálogo documentado | **582 señas** |
| Implementadas en código | **136 IDs únicos** (109 en GESTO_PALABRA + 27 letras en evaluarLetra) |
| Reclamo histórico de la doc | ~400+ (era aspiracional; número realizable = 235–250 tras todas las fases) |

**Leyenda de viabilidad técnica:**

| Icono | Tipo | Modelo MediaPipe | Ejemplo |
|---|---|---|---|
| 🖐️ | Mano estática (1 mano) | Hand Landmarker | Quién, Bien, Más |
| ✌️ | Bimanual (2 manos) | Hand Landmarker | Ayudar, Acuerdo |
| 💫 | Con movimiento | Hand Landmarker (historial) | Ir, Vender, Descanso |
| 🧍 | Ubicación de cuerpo | Pose Landmarker (Fase 6) | Oficina, Sentarse |
| 😊 | Expresión facial | Face Landmarker (Fase 7) | Tristeza, Enojo |

**Estado:** ✅ implementada · 🔁 cubierta por otra seña · ⚠️ colisión de configuración manual (requiere calibración) · ⏳ pendiente

---

## 🗂️ ÍNDICE DE BLOQUES

| Bloque | Contenido | Señas | Implementadas |
|---|---|---|---|
| **A** | PREGUNTAS Y CONECTORES DE CONVERSACIÓN | 26 | 4 |
| **B** | VERBOS DE ACCIÓN COTIDIANA | 86 | 56 |
| **C** | TIEMPO Y FRECUENCIA | 30 | 15 |
| **C2** | CALENDARIO: DÍAS Y MESES | 19 | 0 |
| **D** | ADJETIVOS DE EVALUACIÓN Y ESTADO | 27 | 0 |
| **E** | FRASES-GESTO DE CONVERSACIÓN | 22 | 0 |
| **F** | PRESENTACIONES, IDENTIDAD, PERSONAS Y CARGOS | 35 | 1 |
| **G** | REUNIONES Y COOPERACIÓN | 32 | 3 |
| **H** | CLIENTE, DINERO, DOCUMENTOS Y TRÁMITES | 40 | 0 |
| **I** | SEGURIDAD, SALUD Y EMERGENCIAS | 30 | 2 |
| **J** | UBICACIONES, ESPACIOS Y MOBILIARIO | 26 | 0 |
| **K** | TECNOLOGÍA Y HERRAMIENTAS DIGITALES | 55 | 1 |
| **L** | EMOCIONES DEL DÍA A DÍA | 32 | 1 |
| **M** | NÚMEROS Y CANTIDADES | 35 | 3 |
| **N** | SALUDOS, CORTESÍA Y LÉXICO FUNDACIONAL | 34 | 21 |
| **P** | SITUACIONES LABORALES Y RR.HH. | 25 | 0 |
| **O** | DACTILOLOGÍA LSC (27 letras) | 27 | 27 |
| **TOTAL** | | **582** | **136** |

---

## ✨ BLOQUE A — PREGUNTAS Y CONECTORES DE CONVERSACIÓN

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| QUE | Qué | 🖐️ | ✅ |
| QUIEN | Quién | 🖐️ | ⏳ |
| DONDE | Dónde | 💫 | ✅ |
| CUANDO | Cuándo | 🖐️ | ⏳ |
| POR_QUE | Por qué | 🖐️ | ⏳ |
| COMO | Cómo | 🖐️ | ⏳ |
| CUANTO | Cuánto | 🖐️ | ⏳ |
| CUAL | Cuál | 🖐️ | ⏳ |
| PARA_QUE | Para qué | 🖐️ | ⏳ |
| NADA | Nada | 🖐️ | ✅ |
| TODO | Todo | 🖐️ | ⏳ |
| ALGO | Algo | 🖐️ | ⏳ |
| NADIE | Nadie | 🖐️ | ⏳ |
| TAMBIEN | También | 🖐️ | ✅ |
| TAMPOCO | Tampoco | 🖐️ | ⏳ |
| AQUI | Aquí | 🧍 | ⏳ |
| ALLA | Allá | 🧍 | ⏳ |
| CERCA | Cerca | 🖐️ | ⏳ |
| LEJOS | Lejos | 🖐️ | ⏳ |
| ARRIBA | Arriba | 🧍 | ⏳ |
| ABAJO | Abajo | 🧍 | ⏳ |
| ADENTRO | Adentro | 🧍 | ⏳ |
| AFUERA | Afuera | 🧍 | ⏳ |
| ANTES | Antes | 💫 | ⏳ |
| DESPUES | Después | 💫 | ⏳ |
| NO_ENTENDER | No entender | 😊 | ⏳ |

## ✨ BLOQUE B — VERBOS DE ACCIÓN COTIDIANA

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| IR | Ir | 💫 | ✅ |
| VENIR | Venir | 🖐️ | ✅ |
| LLEGAR | Llegar | 💫 | ✅ |
| SALIR | Salir | 💫 | ✅ |
| ENTRAR | Entrar | 💫 | ✅ |
| QUERER | Querer | 🖐️ | ✅ |
| PODER | Poder | 🖐️ | ✅ |
| DEBER | Deber | 🖐️ | ✅ |
| TENER | Tener | 🖐️ | ✅ |
| HACER | Hacer | 🖐️ | ⏳ |
| AYUDAR | Ayudar | ✌️ | ⏳ |
| ESPERAR | Esperar | ✌️ | ⏳ |
| BUSCAR | Buscar | 💫 | ✅ |
| ENCONTRAR | Encontrar | 💫 | ⏳ |
| TRAER | Traer | 💫 | ⏳ |
| LLEVAR | Llevar | 💫 | ⏳ |
| DAR | Dar | ✌️ | ⏳ |
| TOMAR | Tomar | 🖐️ | ✅ |
| DEJAR | Dejar | ✌️ | ⏳ |
| EMPEZAR | Empezar | 💫 | ✅ |
| TERMINAR | Terminar | 💫 | ⏳ |
| CONTINUAR | Continuar | 💫 | ✅ |
| REPETIR | Repetir | 💫 | ✅ |
| INTENTAR | Intentar | 💫 | ✅ |
| LOGRAR | Lograr | 🖐️ | ✅ |
| CONSEGUIR | Conseguir | 💫 | ✅ |
| PREGUNTAR | Preguntar | 💫 | ✅ |
| RESPONDER | Responder | 💫 | ✅ |
| EXPLICAR | Explicar | ✌️ | ⏳ |
| ENSEÑAR | Enseñar | ✌️ | ⏳ |
| APRENDER | Aprender | 💫 | ✅ |
| ENTENDER | Entender | 🖐️ | ✅ |
| SABER | Saber | 🖐️ | ✅ |
| MOSTRAR | Mostrar | ✌️ | ⏳ |
| MIRAR | Mirar | 🧍 | ⏳ |
| LEER | Leer | 💫 | ✅ |
| ESCRIBIR | Escribir | 💫 | ✅ |
| HABLAR | Hablar | 💫 | ✅ |
| ESCUCHAR | Escuchar | 🧍 | ⏳ |
| AVISAR | Avisar | 🖐️ | ✅ |
| INFORMAR | Informar | ✌️ | ⏳ |
| CONFIRMAR | Confirmar | 🖐️ | ✅ |
| CANCELAR | Cancelar | ✌️ | ⏳ |
| CAMBIAR | Cambiar | 💫 | ✅ |
| MEJORAR | Mejorar | 💫 | ✅ |
| REPARAR | Reparar | 💫 | ✅ |
| TRABAJAR | Trabajar | ✌️ | ✅ |
| SUPERVISAR | Supervisar | 🖐️ | ✅ |
| ENVIAR | Enviar | ✌️ | ✅ |
| PEDIR | Pedir | ✌️ | ✅ |
| RECHAZAR_GESTO | Rechazar | 💫 | ✅ |
| RECIBIR_GESTO | Recibir | 💫 | ✅ |
| PRODUCIR | Producir | 💫 | ✅ |
| VENDER | Vender | 💫 | ✅ |
| COMPRAR_GESTO | Comprar | ✌️ | ⏳ |
| SERVIR | Servir | ✌️ | ⏳ |
| ORGANIZAR | Organizar | ✌️ | ⏳ |
| PLANIFICAR | Planificar | ✌️ | ⏳ |
| EJECUTAR | Ejecutar | 💫 | ✅ |
| INSPECCIONAR | Inspeccionar | 🧍 | ⏳ |
| EVALUAR_GESTO | Evaluar | 🧍 | ⏳ |
| CALIFICAR | Calificar | 🖐️ | ✅ |
| INVESTIGAR | Investigar | 💫 | ✅ |
| ANALIZAR | Analizar | 💫 | ✅ |
| TRANSFERIR_GESTO | Transferir | 💫 | ✅ |
| COPIAR_GESTO | Copiar | ✌️ | ⏳ |
| IMPRIMIR_GESTO | Imprimir | 💫 | ✅ |
| GUARDAR_GESTO | Guardar | 💫 | ✅ |
| ELIMINAR_GESTO | Eliminar | 💫 | ✅ |
| CORREGIR | Corregir | 💫 | ✅ |
| PRIORIZAR | Priorizar | 🖐️ | ✅ |
| ASIGNAR_GESTO | Asignar | ✌️ | ⏳ |
| DELEGAR | Delegar | ✌️ | ⏳ |
| COLABORAR | Colaborar | ✌️ | ⏳ |
| COORDINAR | Coordinar | ✌️ | ⏳ |
| LIDERAR | Liderar | 🧍 | ⏳ |
| MOTIVAR_GESTO | Motivar | 🧍 | ⏳ |
| RESOLVER_GESTO | Resolver | 💫 | ✅ |
| SOLICITUD_GESTO | Solicitar | 💫 | ✅ |
| AUTORIZACION_GESTO | Autorizar | 🖐️ | ✅ |
| CONSULTAR | Consultar | 💫 | ✅ |
| ACTUALIZAR | Actualizar | 💫 | ✅ |
| REGISTRAR | Registrar | 💫 | ✅ |
| VERIFICAR | Verificar | 🖐️ | ✅ |
| AGENDAR | Agendar | ✌️ | ⏳ |
| ALMACENAR | Almacenar | 💫 | ✅ |

## ✨ BLOQUE C — TIEMPO Y FRECUENCIA

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| HORA | Hora | 🖐️ | ✅ |
| AHORA | Ahora | 🖐️ | ✅ |
| HOY | Hoy | ✌️ | ✅ |
| MAÑANA | Mañana | 💫 | ✅ |
| AYER | Ayer | 💫 | ✅ |
| TEMPRANO | Temprano | 💫 | ✅ |
| TARDE | Tarde | 💫 | ✅ |
| PUNTUAL | Puntual | 🖐️ | ✅ |
| TARDE_RETRASO | Retraso | 💫 | ⏳ |
| RAPIDO | Rápido | 💫 | ✅ |
| LENTO | Lento | 💫 | ✅ |
| SIEMPRE | Siempre | 💫 | ✅ |
| NUNCA | Nunca | 💫 | ✅ |
| A_VECES | A veces | 💫 | ✅ |
| CADA_DIA | Cada día | ✌️ | ⏳ |
| PROXIMO | Próximo | 🧍 | ⏳ |
| PASADO | Pasado | 💫 | ⏳ |
| ESTA_SEMANA | Esta semana | 💫 | ⏳ |
| ESTE_MES | Este mes | 💫 | ⏳ |
| ESTE_ANO | Este año | 💫 | ⏳ |
| DURACION | Duración | 💫 | ✅ |
| TIEMPO_LIBRE | Tiempo libre | ✌️ | ⏳ |
| DESCANSO | Descanso | 💫 | ⏳ |
| HORA_EXTRA | Hora extra | 💫 | ⏳ |
| FIN_DE_SEMANA | Fin de semana | ✌️ | ⏳ |
| ALMUERZO | Almuerzo | 🖐️ | ✅ |
| VACACIONES | Vacaciones | 🧍 | ⏳ |
| MADRUGADA | Madrugada | 🧍 | ⏳ |
| MEDIODIA | Mediodía | 🧍 | ⏳ |
| NOCHE_ | Noche | 🧍 | ⏳ |

## ✨ BLOQUE C2 — CALENDARIO: DÍAS Y MESES

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| LUNES | Lunes | 🖐️ | ⏳ |
| MARTES | Martes | 🖐️ | ⏳ |
| MIERCOLES | Miércoles | 🖐️ | ⏳ |
| JUEVES | Jueves | 🖐️ | ⏳ |
| VIERNES | Viernes | 🖐️ | ⏳ |
| SABADO | Sábado | 🖐️ | ⏳ |
| DOMINGO | Domingo | 🖐️ | ⏳ |
| ENERO | Enero | 🖐️ | ⏳ |
| FEBRERO | Febrero | 🖐️ | ⏳ |
| MARZO | Marzo | 🖐️ | ⏳ |
| ABRIL | Abril | 🖐️ | ⏳ |
| MAYO | Mayo | 🖐️ | ⏳ |
| JUNIO | Junio | 🖐️ | ⏳ |
| JULIO | Julio | 🖐️ | ⏳ |
| AGOSTO | Agosto | 🖐️ | ⏳ |
| SEPTIEMBRE | Septiembre | 🖐️ | ⏳ |
| OCTUBRE | Octubre | 🖐️ | ⏳ |
| NOVIEMBRE | Noviembre | 🖐️ | ⏳ |
| DICIEMBRE | Diciembre | 🖐️ | ⏳ |

## ✨ BLOQUE D — ADJETIVOS DE EVALUACIÓN Y ESTADO

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| BIEN | Bien | 🖐️ | ⏳ |
| MAL | Mal | 🖐️ | ⏳ |
| LISTO | Listo | 🖐️ | ⏳ |
| PREPARADO | Preparado | 🖐️ | ⏳ |
| DISPONIBLE | Disponible | 🖐️ | ⏳ |
| OCUPADO | Ocupado | 🖐️ | ⏳ |
| FACIL | Fácil | 💫 | ⏳ |
| DIFICIL | Difícil | 💫 | ⏳ |
| BUENO | Bueno | 🖐️ | ⏳ |
| MALO | Malo | 🖐️ | ⏳ |
| NUEVO | Nuevo | 💫 | ⏳ |
| VIEJO | Viejo | 💫 | ⏳ |
| GRANDE | Grande | ✌️ | ⏳ |
| PEQUEÑO | Pequeño | ✌️ | ⏳ |
| MAS | Más | 🖐️ | ⏳ |
| MENOS | Menos | 🖐️ | ⏳ |
| IGUAL | Igual | ✌️ | ⏳ |
| DIFERENTE | Diferente | ✌️ | ⏳ |
| COMPLETO | Completo | 🖐️ | ⏳ |
| VACIO | Vacío | 🖐️ | ⏳ |
| CORRECTO | Correcto | 🖐️ | ⏳ |
| INCORRECTO | Incorrecto | 🖐️ | ⏳ |
| IMPORTANTE | Importante | 🖐️ | ⏳ |
| URGENTE | Urgente | 💫 | ⏳ |
| NECESARIO | Necesario | 🖐️ | ⏳ |
| DISPONIBLE_NO | No disponible | 🖐️ | ⏳ |
| PRECISO | Preciso | 🖐️ | ⏳ |

## ✨ BLOQUE E — FRASES-GESTO DE CONVERSACIÓN

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| COMO_ESTAS | ¿Cómo estás? | ✌️ | ⏳ |
| QUE_NECESITAS | ¿Qué necesitas? | ✌️ | ⏳ |
| PUEDES_AYUDARME | ¿Puedes ayudarme? | ✌️ | ⏳ |
| NECESITO_AYUDA | Necesito ayuda | ✌️ | ⏳ |
| ESTOY_LISTO | Estoy listo | 🖐️ | ⏳ |
| ESTOY_OCUPADO | Estoy ocupado | ✌️ | ⏳ |
| NO_TENGO_TIEMPO | No tengo tiempo | ✌️ | ⏳ |
| ESPERA_MOMENTO | Espera un momento | 🖐️ | ⏳ |
| VAMOS_REUNION | Vamos a la reunión | 💫 | ⏳ |
| TODO_BIEN | Todo bien | ✌️ | ⏳ |
| QUE_HORA_ES | ¿Qué hora es? | ✌️ | ⏳ |
| DONDE_ESTA | ¿Dónde está? | 🧍 | ⏳ |
| QUIEN_ES | ¿Quién es? | 🧍 | ⏳ |
| CUANDO_ENTREGAS | ¿Cuándo entregas? | ✌️ | ⏳ |
| ESTA_LISTO | ¿Está listo? | 🖐️ | ⏳ |
| ENTIENDO | Entiendo | 🖐️ | ⏳ |
| NO_ENTIENDO | No entiendo | 😊 | ⏳ |
| REPITE_POR_FAVOR | Repite por favor | 💫 | ⏳ |
| MAS_DESPACIO | Más despacio | 💫 | ⏳ |
| PERMISO | Permiso | 🖐️ | ⏳ |
| PUEDO_PASAR | ¿Puedo pasar? | 🧍 | ⏳ |
| AVISAME | Avísame | 🖐️ | ⏳ |

## ✨ BLOQUE F — PRESENTACIONES, IDENTIDAD, PERSONAS Y CARGOS

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| MI_NOMBRE_ES | Mi nombre es… | 🧍 | ⏳ |
| COMO_TE_LLAMAS | ¿Cómo te llamas? | 🧍 | ⏳ |
| SOY_DE | Soy de… | 🧍 | ⏳ |
| TRABAJO_EN | Trabajo en… | 🧍 | ⏳ |
| MI_CARGO | Mi cargo es… | 🧍 | ⏳ |
| EDAD | Edad | 💫 | ⏳ |
| FELIZ_CONOCERTE | Feliz de conocerte | ✌️ | ⏳ |
| MUCHO_GUSTO | Mucho gusto | ✌️ | ⏳ |
| SOY_SORDO | Soy sordo | 🧍 | ⏳ |
| INTERPRETE | Intérprete | 🧍 | ⏳ |
| LENGUA_SEÑAS | Lengua de señas | ✌️ | ⏳ |
| COMUNICACION | Comunicación | ✌️ | ⏳ |
| PACIENCIA | Paciencia | 🖐️ | ⏳ |
| ESCRIBELO | Escríbelo | 💫 | ⏳ |
| MUESTRAME | Muéstrame | ✌️ | ⏳ |
| EJEMPLO | Ejemplo | 🖐️ | ⏳ |
| JEFE | Jefe | 🧍 | ⏳ |
| SUPERVISOR | Supervisor | 🧍 | ⏳ |
| GERENTE | Gerente | 🧍 | ⏳ |
| DIRECTOR | Director | 🧍 | ⏳ |
| EMPLEADO | Empleado | 🧍 | ⏳ |
| ASISTENTE | Asistente | 🧍 | ⏳ |
| SECRETARIA | Secretaria | 🧍 | ⏳ |
| CLIENTE | Cliente | 🖐️ | ⏳ |
| PROVEEDOR | Proveedor | 🧍 | ⏳ |
| ENTREVISTADOR | Entrevistador | 🧍 | ⏳ |
| CANDIDATO | Candidato | 🧍 | ⏳ |
| COLEGAS | Colegas | 🧍 | ⏳ |
| EQUIPO | Equipo | ✌️ | ⏳ |
| RECURSOS_HUMANOS | Recursos humanos | 🖐️ | ⏳ |
| CONTABILIDAD | Contabilidad | 🖐️ | ⏳ |
| VENTAS | Ventas | 🖐️ | ⏳ |
| MARKETING | Marketing | 🖐️ | ⏳ |
| LEGAL | Legal | 🖐️ | ⏳ |
| IT_SISTEMAS | IT / Sistemas | 🖐️ | ⏳ |

## ✨ BLOQUE G — REUNIONES Y COOPERACIÓN

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| REUNION | Reunión | ✌️ | ✅ |
| PAUSA | Pausa | ✌️ | ✅ |
| INFORME | Informe | ✌️ | ✅ |
| APROBAR | Aprobar | ✌️ | ✅ |
| HABLAR_EN_REUNION | Hablar en reunión | 💫 | ⏳ |
| PARTICIPAR | Participar | 💫 | ⏳ |
| OPINION | Opinar | 💫 | ⏳ |
| CONSENSO | Consenso | ✌️ | ⏳ |
| DISCUSION | Discusión | ✌️ | ⏳ |
| PRESENTACION | Presentación | ✌️ | ⏳ |
| CONFERENCIA | Conferencia | ✌️ | ⏳ |
| ACTA | Acta | 💫 | ⏳ |
| REPORTE_GESTO | Reporte | 🖐️ | ⏳ |
| HACER_PREGUNTA | Hacer pregunta | 💫 | ⏳ |
| RESPONDER_GESTO | Responder | 💫 | ⏳ |
| ACUERDO | Acuerdo | ✌️ | ⏳ |
| DESACUERDO | Desacuerdo | ✌️ | ⏳ |
| PROPUESTA | Propuesta | ✌️ | ⏳ |
| IDEA | Idea | 🖐️ | ⏳ |
| PLAN | Plan | ✌️ | ⏳ |
| OBJETIVO | Objetivo | 🖐️ | ⏳ |
| META | Meta | 🖐️ | ⏳ |
| PROYECTO | Proyecto | ✌️ | ⏳ |
| DIVIDIR_TAREAS | Dividir tareas | ✌️ | ⏳ |
| FECHA_LIMITE | Fecha límite | 🖐️ | ⏳ |
| AGENDA | Agenda | 💫 | ⏳ |
| ORDEN_DIA | Orden del día | ✌️ | ⏳ |
| VOTAR | Votar | 🖐️ | ⏳ |
| MAYORIA | Mayoría | 🖐️ | ⏳ |
| PROGRESO | Progreso | 💫 | ⏳ |
| AVANCE | Avance | 💫 | ⏳ |
| RESULTADO | Resultado | 🖐️ | ⏳ |
| DECISION | Decisión | 🖐️ | ⏳ |

## ✨ BLOQUE H — CLIENTE, DINERO, DOCUMENTOS Y TRÁMITES

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| PAGO | Pago | 💫 | ⏳ |
| COBRO | Cobro | 💫 | ⏳ |
| FACTURA | Factura | 💫 | ⏳ |
| RECIBO_GESTO | Recibo | 💫 | ⏳ |
| PRECIO | Precio | 🖐️ | ⏳ |
| VALOR | Valor | 🖐️ | ⏳ |
| DESCUENTO | Descuento | 💫 | ⏳ |
| OFERTA | Oferta | 💫 | ⏳ |
| PRESUPUESTO_GESTO | Presupuesto | 💫 | ⏳ |
| CONTRATO | Contrato | ✌️ | ⏳ |
| FIRMA_GESTO | Firma | 💫 | ⏳ |
| GARANTIA | Garantía | ✌️ | ⏳ |
| DEVOLUCION | Devolución | 💫 | ⏳ |
| CAMBIO | Cambio | 💫 | ⏳ |
| EFECTIVO | Efectivo | 💫 | ⏳ |
| TARJETA | Tarjeta | 💫 | ⏳ |
| TRANSFERENCIA | Transferencia | 💫 | ⏳ |
| CREDITO | Crédito | 🖐️ | ⏳ |
| DEUDA | Deuda | 🖐️ | ⏳ |
| ABONO | Abono | 💫 | ⏳ |
| SALDO | Saldo | 🖐️ | ⏳ |
| PEDIDO | Pedido | 💫 | ⏳ |
| DOCUMENTO_GESTO | Documento | ✌️ | ⏳ |
| IDENTIFICACION | Identificación | 🧍 | ⏳ |
| CURRICULUM | Currículum | ✌️ | ⏳ |
| CARTA_GESTO | Carta | 💫 | ⏳ |
| INFORME_FINANCIERO | Informe financiero | ✌️ | ⏳ |
| NOMINA | Nómina | 💫 | ⏳ |
| CERTIFICADO | Certificado | ✌️ | ⏳ |
| CONSTANCIA | Constancia | 💫 | ⏳ |
| FORMULARIO_GESTO | Formulario | 💫 | ⏳ |
| POLIZA | Póliza | ✌️ | ⏳ |
| CONTRATO_COLECTIVO | Contrato colectivo | ✌️ | ⏳ |
| LEGISLACION | Legislación | ✌️ | ⏳ |
| REGLAMENTO | Reglamento | ✌️ | ⏳ |
| CODIGO_CONDUCTA | Código de conducta | ✌️ | ⏳ |
| CONFIDENCIALIDAD | Confidencialidad | 🧍 | ⏳ |
| DERECHOS_AUTOR | Derechos de autor | ✌️ | ⏳ |
| PATENTE | Patente | 🖐️ | ⏳ |
| MARCA_GESTO | Marca | 🖐️ | ⏳ |

## ✨ BLOQUE I — SEGURIDAD, SALUD Y EMERGENCIAS

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| PELIGRO | Peligro | 💫 | ✅ |
| EMERGENCIA_GESTO | Emergencia | 💫 | ✅ |
| SOCORRO | Socorro | 💫 | ⏳ |
| INCENDIO | Incendio | 💫 | ⏳ |
| EVACUACION | Evacuación | 💫 | ⏳ |
| SALIDA_EMERGENCIA | Salida de emergencia | 🧍 | ⏳ |
| EXTINTOR | Extintor | 🖐️ | ⏳ |
| BOTIQUIN | Botiquín | 🧍 | ⏳ |
| LESION | Lesión | 🧍 | ⏳ |
| ACCIDENTE | Accidente | 💫 | ⏳ |
| RIESGO | Riesgo | 💫 | ⏳ |
| BOMBERO | Bombero | 🧍 | ⏳ |
| AMBULANCIA | Ambulancia | 💫 | ⏳ |
| CUIDADO | Cuidado | 🖐️ | ⏳ |
| DOLOR_GESTO | Dolor | 🧍 | ⏳ |
| DOLOR_CABEZA | Dolor de cabeza | 🧍 | ⏳ |
| DOLOR_ESPALDA | Dolor de espalda | 🧍 | ⏳ |
| FATIGA | Fatiga | 🧍 | ⏳ |
| CANSANCIO | Cansancio | 🧍 | ⏳ |
| ENFERMO | Enfermo | 🧍 | ⏳ |
| MEDICINA | Medicina | 🖐️ | ⏳ |
| EJERCICIO | Ejercicio | 💫 | ⏳ |
| AGUA | Agua | 💫 | ⏳ |
| ERGONOMIA | Ergonomía | 💫 | ⏳ |
| DOCTOR | Doctor | 🧍 | ⏳ |
| SEGURO | Seguro | 🖐️ | ⏳ |
| CASCO | Casco de seguridad | 🧍 | ⏳ |
| GUANTES | Guantes | 🧍 | ⏳ |
| PROTECCION | Protección | ✌️ | ⏳ |
| MAREADO | Mareado | 🧍 | ⏳ |

## ✨ BLOQUE J — UBICACIONES, ESPACIOS Y MOBILIARIO

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| OFICINA | Oficina | 🧍 | ⏳ |
| SALA_REUNIONES | Sala de reuniones | 🧍 | ⏳ |
| RECEPCION | Recepción | 🧍 | ⏳ |
| PASILLO | Pasillo | 🧍 | ⏳ |
| BANO | Baño | 🧍 | ⏳ |
| CAFETERIA | Cafetería | 🧍 | ⏳ |
| ESTACIONAMIENTO | Estacionamiento | 🧍 | ⏳ |
| ALMACEN | Almacén | 🧍 | ⏳ |
| LABORATORIO | Laboratorio | 🧍 | ⏳ |
| PLANTA | Planta | 🧍 | ⏳ |
| GERENCIA | Gerencia | 🧍 | ⏳ |
| PUERTA | Puerta | 🧍 | ⏳ |
| VENTANA | Ventana | 🧍 | ⏳ |
| EXTERIOR | Exterior | 🧍 | ⏳ |
| INTERIOR | Interior | 🧍 | ⏳ |
| ESCALERA | Escalera | 🧍 | ⏳ |
| ASCENSOR | Ascensor | 🧍 | ⏳ |
| CUBICULO | Cubículo | 🧍 | ⏳ |
| ESCRITORIO | Escritorio | 🧍 | ⏳ |
| SILLA | Silla | 🧍 | ⏳ |
| ARCHIVERO | Archivero | 🧍 | ⏳ |
| COCINA | Cocina | 🧍 | ⏳ |
| BODEGA | Bodega | 🧍 | ⏳ |
| ARCHIVO | Archivo | 🧍 | ⏳ |
| PISO_2 | Segundo piso | 🧍 | ⏳ |
| PISO_3 | Tercer piso | 🧍 | ⏳ |

## ✨ BLOQUE K — TECNOLOGÍA Y HERRAMIENTAS DIGITALES

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| TECLADO_GESTO | Teclear | 💫 | ✅ |
| COMPUTADORA | Computadora | 🧍 | ⏳ |
| RATON_GESTO | Ratón | 💫 | ⏳ |
| MONITOR | Monitor | 🧍 | ⏳ |
| TELEFONO_GESTO | Teléfono | 🖐️ | 🔁 |
| IMPRESORA | Impresora | 💫 | ⏳ |
| PAPEL_GESTO | Papel | ✌️ | ⏳ |
| BOLIGRAFO | Bolígrafo | 💫 | ⏳ |
| CUADERNO | Cuaderno | ✌️ | ⏳ |
| BORRADOR | Borrador | 💫 | ⏳ |
| CLIPS | Clips | 🖐️ | ⏳ |
| CINTA_ADHESIVA | Cinta adhesiva | 🖐️ | ⏳ |
| PEGAMENTO | Pegamento | 💫 | ⏳ |
| REGLA | Regla | 🖐️ | ⏳ |
| MARCADOR | Marcador | 💫 | ⏳ |
| RESALTADOR | Resaltador | 💫 | ⏳ |
| SOBRES | Sobres | 🖐️ | ⏳ |
| SELLOS | Sellos | 💫 | ⏳ |
| PROYECTOR | Proyector | 🧍 | ⏳ |
| PIZARRA | Pizarra | 🧍 | ⏳ |
| CAMARA | Cámara | 🧍 | ⏳ |
| AUDIFONOS | Audífonos | 🧍 | ⏳ |
| MEMORIA_USB | Memoria USB | 🖐️ | ⏳ |
| CARGA_OR | Cargador | 🧍 | ⏳ |
| BATERIA | Batería | 🖐️ | ⏳ |
| NUBE_CLOUD | Nube | 💫 | ⏳ |
| ENLACE | Enlace | 🧍 | ⏳ |
| PDF_GESTO | PDF | 🖐️ | ⏳ |
| HOJA_CALCULO | Hoja de cálculo | 💫 | ⏳ |
| PROCESADOR_TEXTO | Procesador de texto | 💫 | ⏳ |
| PRESENTACION_GESTO | Presentación digital | 💫 | ⏳ |
| DIAPOSITIVA | Diapositiva | 🧍 | ⏳ |
| CHAT_GESTO | Chat | 💫 | ⏳ |
| NOTIFICACION | Notificación | 💫 | ⏳ |
| ENVIAR_EMAIL | Enviar email | 💫 | ⏳ |
| RECIBIR_EMAIL | Recibir email | 💫 | ⏳ |
| ADJUNTAR | Adjuntar | 💫 | ⏳ |
| RESPONDER_EMAIL | Responder email | 💫 | ⏳ |
| REENVIO | Reenviar | 💫 | ⏳ |
| BORRAR_EMAIL | Borrar email | 💫 | ⏳ |
| CORREO_NO_DESEADO | Correo no deseado | 💫 | ⏳ |
| FIRMA_DIGITAL | Firma digital | 💫 | ⏳ |
| SUBIR_ARCHIVO | Subir archivo | 💫 | ⏳ |
| DESCARGAR_GESTO | Descargar | 💫 | ⏳ |
| GUARDAR_NUBE | Guardar en la nube | 💫 | ⏳ |
| COPIAR_PEGAR | Copiar y pegar | 💫 | ⏳ |
| BUSCAR_WEB | Buscar en la web | 💫 | ⏳ |
| CONFIGURACION | Configuración | 💫 | ⏳ |
| ACTUALIZAR_GESTO | Actualizar | 💫 | ⏳ |
| WEBCONFERENCIA | Videoconferencia | ✌️ | ⏳ |
| CELULAR | Celular | 🧍 | ⏳ |
| INTERNET | Internet | ✌️ | ⏳ |
| CONTRASEÑA | Contraseña | 🖐️ | ⏳ |
| COMPARTIR_PANTALLA | Compartir pantalla | 💫 | ⏳ |
| GRABAR | Grabar | 💫 | ⏳ |

## ✨ BLOQUE L — EMOCIONES DEL DÍA A DÍA

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| FELICIDAD | Felicidad | 💫 | ✅ |
| TRISTEZA | Tristeza | 😊 | ⏳ |
| ENOJO | Enojo | 😊 | ⏳ |
| PREOCUPACION | Preocupación | 😊 | ⏳ |
| ORGULLO | Orgullo | 😊 | ⏳ |
| FRUSTRACION | Frustración | 😊 | ⏳ |
| CONFUSION | Confusión | 😊 | ⏳ |
| SORPRESA | Sorpresa | 😊 | ⏳ |
| CALMA | Calma | 😊 | ⏳ |
| NERVIOS | Nervios | 😊 | ⏳ |
| MOTIVACION_EMOCION | Motivación | 😊 | ⏳ |
| ENTUSIASMO | Entusiasmo | 😊 | ⏳ |
| RESPETO_GESTO | Respeto | 🖐️ | ⏳ |
| CONFIANZA_GESTO | Confianza | 😊 | ⏳ |
| EMPATIA_GESTO | Empatía | 😊 | ⏳ |
| TOLERANCIA | Tolerancia | 🖐️ | ⏳ |
| SOLIDARIDAD | Solidaridad | ✌️ | ⏳ |
| PROFESIONALISMO | Profesionalismo | 🖐️ | ⏳ |
| RESPONSABILIDAD | Responsabilidad | 🖐️ | ⏳ |
| LEALTAD | Lealtad | 🖐️ | ⏳ |
| TRISTE | Estoy triste | 😊 | ⏳ |
| ENOJADO | Estoy enojado | 😊 | ⏳ |
| SORPRENDIDO | Estoy sorprendido | 😊 | ⏳ |
| CONFUNDIDO | Estoy confundido | 😊 | ⏳ |
| ABURRIDO | Estoy aburrido | 😊 | ⏳ |
| ASUSTADO | Estoy asustado | 😊 | ⏳ |
| AGOTADO | Estoy agotado | 🧍 | ⏳ |
| ESTRESADO | Estresado | 😊 | ⏳ |
| ANSIOSO | Ansioso | 😊 | ⏳ |
| SATISFECHO | Satisfecho | 😊 | ⏳ |
| AGRADECIDO | Agradecido | 😊 | ⏳ |
| EMOCIONADO | Emocionado | 😊 | ⏳ |

## ✨ BLOQUE M — NÚMEROS Y CANTIDADES

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| NUMERO_0 | Cero | 🖐️ | ⏳ |
| NUMERO_1 | Uno | 🖐️ | ⚠️ |
| NUMERO_2 | Dos | 🖐️ | ⚠️ |
| NUMERO_3 | Tres | 🖐️ | ✅ |
| NUMERO_4 | Cuatro | 🖐️ | ⚠️ |
| NUMERO_5 | Cinco | 🖐️ | ⚠️ |
| NUMERO_6 | Seis | 🖐️ | ✅ |
| NUMERO_7 | Siete | 🖐️ | ✅ |
| NUMERO_8 | Ocho | 🖐️ | ⚠️ |
| NUMERO_9 | Nueve | 🖐️ | ⚠️ |
| NUMERO_10 | Diez | 🖐️ | ⚠️ |
| NUMERO_11 | Once | 💫 | ⏳ |
| NUMERO_12 | Doce | 💫 | ⏳ |
| NUMERO_13 | Trece | 💫 | ⏳ |
| NUMERO_14 | Catorce | 💫 | ⏳ |
| NUMERO_15 | Quince | 💫 | ⏳ |
| NUMERO_16 | Dieciséis | 💫 | ⏳ |
| NUMERO_17 | Diecisiete | 💫 | ⏳ |
| NUMERO_18 | Dieciocho | 💫 | ⏳ |
| NUMERO_19 | Diecinueve | 💫 | ⏳ |
| NUMERO_20 | Veinte | 💫 | ⏳ |
| NUMERO_30 | Treinta | 💫 | ⏳ |
| NUMERO_40 | Cuarenta | 💫 | ⏳ |
| NUMERO_50 | Cincuenta | 💫 | ⏳ |
| NUMERO_60 | Sesenta | 💫 | ⏳ |
| NUMERO_70 | Setenta | 💫 | ⏳ |
| NUMERO_80 | Ochenta | 💫 | ⏳ |
| NUMERO_90 | Noventa | 💫 | ⏳ |
| NUMERO_100 | Cien | 💫 | ⏳ |
| NUMERO_1000 | Mil | 💫 | ⏳ |
| MAYOR_QUE | Mayor que | ✌️ | ⏳ |
| MENOR_QUE | Menor que | ✌️ | ⏳ |
| IGUAL_QUE | Igual que | ✌️ | ⏳ |
| MITAD | Mitad | 🖐️ | ⏳ |
| DOBLE | Doble | 🖐️ | ⏳ |

## ✨ BLOQUE N — SALUDOS, CORTESÍA Y LÉXICO FUNDACIONAL

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| PALMA_ABIERTA | Hola | 🖐️ | ✅ |
| PULGAR_ARRIBA | Sí | 🖐️ | ✅ |
| PULGAR_ABAJO | No | 🖐️ | ✅ |
| VICTORIA | Adiós | 🖐️ | ✅ |
| ONDEO | Adiós (ondeo) | 💫 | ✅ |
| TE_QUIERO | Te quiero | 🖐️ | ✅ |
| INDICE_ARRIBA | Atención | 🖐️ | ✅ |
| PUÑO_CERRADO | Gracias | 🖐️ | ✅ |
| TRES_DEDOS | Por favor | 🖐️ | ✅ |
| CUATRO_DEDOS | Necesito | 🖐️ | ✅ |
| OK_SIGN | Perfecto | 🖐️ | ✅ |
| PULGAR_MEÑIQUE | Llamar | 🖐️ | ✅ |
| MEÑIQUE_ARRIBA | Promesa | 🖐️ | ✅ |
| PINZA | Poco | 🖐️ | ✅ |
| CORAZON | Amor | ✌️ | ✅ |
| PARAR | Parar | ✌️ | ✅ |
| APLAUSO | Aplauso | ✌️ | ✅ |
| PAZ | Paz | ✌️ | ✅ |
| ORACION | Oración | ✌️ | ✅ |
| APUNTAR_ARRIBA | Mira arriba | 💫 | ✅ |
| APUNTAR_ABAJO | Mira abajo | 💫 | ✅ |
| SALUDO_BUENOS_DIAS | Buenos días | 💫 | ⏳ |
| SALUDO_BUENAS_TARDES | Buenas tardes | 💫 | ⏳ |
| SALUDO_BUENAS_NOCHES | Buenas noches | 💫 | ⏳ |
| DISCULPE | Disculpe | 💫 | ⏳ |
| PERDON | Perdón | 💫 | ⏳ |
| CON_PERMISO | Con permiso | 💫 | ⏳ |
| BIENVENIDO | Bienvenido | 💫 | ⏳ |
| HASTA_LUEGO | Hasta luego | 💫 | ⏳ |
| HASTA_MAÑANA | Hasta mañana | 💫 | ⏳ |
| BUEN_TRABAJO | Buen trabajo | 💫 | ⏳ |
| FELICITACIONES | Felicitaciones | ✌️ | ⏳ |
| EXITO | Éxito | 🖐️ | ⏳ |
| SUERTE | Suerte | 🖐️ | ⏳ |

## ✨ BLOQUE P — SITUACIONES LABORALES Y RR.HH.

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| ENTREVISTA | Entrevista | ✌️ | ⏳ |
| PRUEBA_TECNICA | Prueba técnica | 💫 | ⏳ |
| EVALUACION_DESEMPEÑO | Evaluación de desempeño | ✌️ | ⏳ |
| ASCENSO | Ascenso | 💫 | ⏳ |
| BONO | Bono | 🖐️ | ⏳ |
| PERMISO_GESTO | Permiso | 💫 | ⏳ |
| LICENCIA_MATERNA | Licencia materna | 🧍 | ⏳ |
| LICENCIA_PATERNIDAD | Licencia paternidad | 🧍 | ⏳ |
| INCAPACIDAD | Incapacidad | 💫 | ⏳ |
| RETIRO | Retiro | 💫 | ⏳ |
| RENUNCIA | Renuncia | ✌️ | ⏳ |
| DESPIDO | Despido | 💫 | ⏳ |
| SUSPENSION | Suspensión | 💫 | ⏳ |
| PRACTICAS | Prácticas | 💫 | ⏳ |
| CONTRATO_TEMPORAL | Contrato temporal | 💫 | ⏳ |
| CONTRATO_INDEFINIDO | Contrato indefinido | 💫 | ⏳ |
| PRUEBA_CONTRATO | Periodo de prueba | 💫 | ⏳ |
| CAPACITACION | Capacitación | 💫 | ⏳ |
| TALLER | Taller | 💫 | ⏳ |
| CONGRESO | Congreso | 🧍 | ⏳ |
| FERIA | Feria | 🧍 | ⏳ |
| NETWORKING | Networking | 💫 | ⏳ |
| TELETRABAJO | Teletrabajo | ✌️ | ⏳ |
| HOME_OFFICE | Home office | ✌️ | ⏳ |
| MODALIDAD_MIXTA | Modalidad mixta | ✌️ | ⏳ |

## ✨ BLOQUE O — DACTILOLOGÍA LSC (27 letras)

| ID | Significado | Tipo | Estado |
|---|---|---|---|
| LETRA_A | A | 🖐️ | ✅ |
| LETRA_B | B | 🖐️ | ✅ |
| LETRA_C | C | 🖐️ | ✅ |
| LETRA_D | D | 🖐️ | ✅ |
| LETRA_E | E | 🖐️ | ✅ |
| LETRA_F | F | 🖐️ | ✅ |
| LETRA_G | G | 🖐️ | ✅ |
| LETRA_H | H | 🖐️ | ✅ |
| LETRA_I | I | 🖐️ | ✅ |
| LETRA_J | J | 💫 | ✅ |
| LETRA_K | K | 🖐️ | ✅ |
| LETRA_L | L | 🖐️ | ✅ |
| LETRA_M | M | 🖐️ | ✅ |
| LETRA_N | N | 🖐️ | ✅ |
| LETRA_O | O | 🖐️ | ✅ |
| LETRA_P | P | 🖐️ | ✅ |
| LETRA_Q | Q | 🖐️ | ✅ |
| LETRA_R | R | 🖐️ | ✅ |
| LETRA_S | S | 🖐️ | ✅ |
| LETRA_T | T | 🖐️ | ✅ |
| LETRA_U | U | 🖐️ | ✅ |
| LETRA_V | V | 🖐️ | ✅ |
| LETRA_W | W | 🖐️ | ✅ |
| LETRA_X | X | 🖐️ | ✅ |
| LETRA_Y | Y | 🖐️ | ✅ |
| LETRA_Z | Z | 💫 | ✅ |
| LETRA_Ñ | Ñ | 🖐️ | ✅ |

---

## 🗺️ HOJA DE RUTA DE IMPLEMENTACIÓN

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Fundación: recuperación + Fases 1–3 de señas (13 nuevas) | ✅ |
| 1 | Documentar catálogo conversacional (este doc) | ✅ |
| 2 | Bloque A (preguntas) + D (adjetivos) — estáticas 🖐️ | ⏳ |
| 3 | Bloque B (verbos) + C (tiempo) — movimiento 💫 | 🟡 lotes 1-6: 60 señas ✅ |
| 4 | Bloque G (reuniones) + E (frases) — bimanuales ✌️ | ⏳ |
| 5 | Bloque M (números) + C2 (días/meses) — secuencia | ⏳ |
| 6 | Pose Landmarker — Bloque J (ubicaciones) + F (personas) 🧍 | ⏳ |
| 7 | Face Landmarker — Bloque L (emociones) 😊 | ⏳ |
| 8 | Formalización con Groq — frases completas | ⏳ |
| 9 | Calibración y pruebas con cámara | ⏳ |
| 10 | Despliegue en producción | ⏳ |

---

## 🔧 TECNOLOGÍAS
- **Frontend**: Angular 20.3 + TypeScript + MediaPipe Tasks Vision
- **Backend**: Django 5.2 + Django REST Framework (Python)
- **IA**: Groq API (formalización de frases)
- **Base de datos**: Firestore (Firebase) · **Autenticación**: Firebase Auth
- **Modelos MediaPipe**: `hand_landmarker.task` (activo) → `pose_landmarker.task` + `face_landmarker.task` (Fases 6–7)

---

## 🚀 CÓMO EJECUTAR

### Backend
```bash
cd back_lexiSing
.venv/bin/python manage.py runserver 0.0.0.0:8000
```

### Frontend
```bash
cd front-lexi-sing
npm run start
```

Frontend: `http://localhost:4200/` · Backend: `http://localhost:8000/`

---

## 📝 NOTAS
- Las señas se confirman con frames consecutivos (estabilización)
- Modos soportados: PALABRAS y DELETREAR
- El archivo `sign-language.service.ts` es el núcleo del reconocimiento
- Catálogo verificado: **582 IDs únicos** (sin duplicados entre bloques)
- Dactilología completa: 27 letras (A–Z + Ñ), todas implementadas en `evaluarLetra`
