#!/usr/bin/env python3
"""Genera el Informe Final ADSO de LexiSing como archivo .docx"""

from docx import Document
from docx.shared import Pt, Cm, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

doc = Document()

# ── Estilos base ──────────────────────────────────────────────
style = doc.styles['Normal']
font = style.font
font.name = 'Times New Roman'
font.size = Pt(12)
style.paragraph_format.space_after = Pt(6)
style.paragraph_format.line_spacing = 1.5

for level in range(1, 4):
    hs = doc.styles[f'Heading {level}']
    hs.font.name = 'Times New Roman'
    hs.font.bold = True
    hs.font.color.rgb = RGBColor(0, 0, 0)
    if level == 1:
        hs.font.size = Pt(16)
    elif level == 2:
        hs.font.size = Pt(14)
    else:
        hs.font.size = Pt(12)
    hs.paragraph_format.space_before = Pt(12)
    hs.paragraph_format.space_after = Pt(6)

# ── Helpers ───────────────────────────────────────────────────
def add_title(text, level=1):
    doc.add_heading(text, level=level)

def add_para(text, bold=False, italic=False, align=None):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = bold
    run.italic = italic
    if align:
        p.alignment = align
    return p

def add_bullet(text):
    p = doc.add_paragraph(text, style='List Bullet')
    return p

def add_table(headers, rows, col_widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        for paragraph in hdr_cells[i].paragraphs:
            for run in paragraph.runs:
                run.bold = True
                run.font.size = Pt(10)
    for row_data in rows:
        row_cells = table.add_row().cells
        for i, val in enumerate(row_data):
            row_cells[i].text = str(val)
            for paragraph in row_cells[i].paragraphs:
                for run in paragraph.runs:
                    run.font.size = Pt(10)
    doc.add_paragraph()
    return table

def add_placeholder(text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.italic = True
    run.font.color.rgb = RGBColor(128, 128, 128)
    return p

# ══════════════════════════════════════════════════════════════
# PORTADA
# ══════════════════════════════════════════════════════════════
doc.add_paragraph()
doc.add_paragraph()
add_para('SENA', bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
add_para('Centro de Gestión de Mercadeo y Tecnologías de la Información', align=WD_ALIGN_PARAGRAPH.CENTER)
add_para('Programa de Formación: Tecnólogo en Análisis y Desarrollo de Software', align=WD_ALIGN_PARAGRAPH.CENTER)
add_para('Ficha: 3203082', align=WD_ALIGN_PARAGRAPH.CENTER)
doc.add_paragraph()
doc.add_paragraph()
add_para('INFORME FINAL DEL PROYECTO', bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
doc.add_paragraph()
add_para('LexiSing', bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
add_para('Plataforma de Comunicación Inclusiva mediante\nLengua de Señas Colombiana', align=WD_ALIGN_PARAGRAPH.CENTER)
doc.add_paragraph()
doc.add_paragraph()
add_para('Aprendices:', bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
add_para('Beickert Gabriel Torres Tapia', align=WD_ALIGN_PARAGRAPH.CENTER)
add_para('Samuel Castro Zuñiga', align=WD_ALIGN_PARAGRAPH.CENTER)
add_para('Cielo Alexandra Rodríguez Pardo', align=WD_ALIGN_PARAGRAPH.CENTER)
add_para('Juan Steban Riveros Orozco', align=WD_ALIGN_PARAGRAPH.CENTER)
doc.add_paragraph()
add_para('Instructores:', bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
add_para('Steffi Velandia', align=WD_ALIGN_PARAGRAPH.CENTER)
add_para('Jose David Luna', align=WD_ALIGN_PARAGRAPH.CENTER)
doc.add_paragraph()
add_para('Ciudad y Fecha de Presentación', align=WD_ALIGN_PARAGRAPH.CENTER)
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# RESUMEN
# ══════════════════════════════════════════════════════════════
add_title('RESUMEN')
add_para(
    'El presente informe documenta el desarrollo de LexiSing, una plataforma web de comunicación inclusiva '
    'diseñada para facilitar la interacción entre personas sordas o mudas y usuarios oyentes mediante el '
    'reconocimiento de Lengua de Señas Colombiana (LSC) en tiempo real. El sistema integra tecnologías de '
    'vanguardia como MediaPipe HandLandmarker para la detección de gestos manuales, inteligencia artificial '
    'mediante Groq API para la formalización de texto, y una arquitectura basada en Angular 20, Django REST '
    'Framework y Firebase Firestore para garantizar comunicaciones en tiempo real. LexiSing reconoce 33 señas '
    'de palabras, 27 letras del abecedario dactilológico LSC y léxico empresarial, permitiendo a las personas '
    'sordas comunicarse de manera fluida en entornos laborales y educativos. El proyecto fue desarrollado bajo '
    'la metodología Scrum en cuatro sprints, cumpliendo con los objetivos planteados de inclusión social, '
    'accesibilidad digital y transformación tecnológica con enfoque humano.'
)
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# ABSTRACT
# ══════════════════════════════════════════════════════════════
add_title('ABSTRACT')
add_para(
    'This document presents the development of LexiSing, an inclusive web platform designed to facilitate '
    'communication between deaf or mute individuals and hearing users through real-time Colombian Sign Language '
    '(LSC) recognition. The system integrates cutting-edge technologies such as MediaPipe HandLandmarker for '
    'hand gesture detection, artificial intelligence via Groq API for text formalization, and an architecture '
    'based on Angular 20, Django REST Framework, and Firebase Firestore for real-time communications. LexiSing '
    'recognizes 33 word signs, 27 letters of the LSC dactylologic alphabet, and enterprise vocabulary, enabling '
    'deaf individuals to communicate fluidly in work and educational environments. The project was developed '
    'under the Scrum methodology in four sprints, meeting the established objectives of social inclusion, '
    'digital accessibility, and human-centered technological transformation.'
)
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# PALABRAS CLAVE
# ══════════════════════════════════════════════════════════════
add_title('PALABRAS CLAVE')
add_para('Reconocimiento de señas, Comunicación inclusiva, Inteligencia artificial, Lengua de Señas Colombiana, Accesibilidad digital.')
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# 1. INTRODUCCIÓN
# ══════════════════════════════════════════════════════════════
add_title('1. INTRODUCCIÓN', level=1)

add_title('1.1 Contexto', level=2)
add_para(
    'La comunicación es un derecho fundamental del ser humano y un pilar esencial para la inclusión social, '
    'laboral y educativa. Sin embargo, las personas sordas o mudas enfrentan barreras significativas en su '
    'interacción cotidiana con el mundo oyente. En Colombia, según datos del Departamento Administrativo '
    'Nacional de Estadística (DANE), aproximadamente 460.000 personas presentan alguna discapacidad auditiva, '
    'y la mayoría depende de la Lengua de Señas Colombiana (LSC) como su principal medio de comunicación.'
)
add_para(
    'En entornos laborales, educativos y de atención al público, la falta de personal capacitado en LSC '
    'genera situaciones de exclusión, malentendidos y dificultades para acceder a servicios básicos. Las '
    'organizaciones que desean ser inclusivas carecen de herramientas tecnológicas efectivas que permitan una '
    'comunicación bidireccional en tiempo real entre personas sordas y oyentes.'
)

add_title('1.2 Descripción General del Proyecto', level=2)
add_para(
    'LexiSing es una plataforma web de comunicación inclusiva que permite a personas sordas o mudas interactuar '
    'con usuarios oyentes mediante el reconocimiento en tiempo real de Lengua de Señas Colombiana. El sistema '
    'utiliza la cámara del dispositivo para detectar gestos manuales a través de MediaPipe HandLandmarker, '
    'traduce las señas identificadas a palabras clave y, mediante inteligencia artificial (Groq API), las '
    'convierte en frases gramaticalmente correctas en español formal.'
)
add_para(
    'La plataforma integra un sistema de chat en tiempo real basado en Firebase Firestore, autenticación segura '
    'con múltiples proveedores (correo electrónico, Google y Microsoft), gestión de roles y permisos, panel de '
    'administración, monitoreo de conversaciones, y un sistema de notificaciones sonoras. El reconocimiento de '
    'señas incluye 33 señas de palabras (incluyendo léxico empresarial), 27 letras del abecedario dactilológico '
    'LSC, y dos modos de operación: modo palabras y modo deletreo.'
)

add_title('1.3 Objetivo del Documento', level=2)
add_para(
    'El presente informe tiene como objetivo documentar de forma integral el proceso de desarrollo del proyecto '
    'LexiSing, desde el planteamiento del problema hasta los resultados obtenidos, incluyendo el análisis, '
    'diseño, implementación, pruebas y despliegue del sistema. Este documento sirve como evidencia académica '
    'del cumplimiento de los objetivos de formación del programa Tecnólogo en Análisis y Desarrollo de Software '
    'del SENA.'
)
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# 2. PLANTEAMIENTO DEL PROBLEMA
# ══════════════════════════════════════════════════════════════
add_title('2. PLANTEAMIENTO DEL PROBLEMA', level=1)

add_title('2.1 Descripción del Problema', level=2)
add_para(
    'Actualmente existe una gran dificultad de comunicación entre personas oyentes y personas sordas o mudas '
    'en entornos laborales, educativos y de atención al público. La falta de conocimiento del lenguaje de '
    'señas obliga a depender de intérpretes o comunicación escrita, lo que genera retrasos, malentendidos y '
    'situaciones de exclusión.'
)
add_para('Las personas sordas o mudas enfrentan barreras de comunicación en:')
add_bullet('Empresas: Atención al cliente, reuniones y procesos administrativos.')
add_bullet('Instituciones públicas: Trámites, atención ciudadana y servicios públicos.')
add_bullet('Centros educativos: Aulas, tutorías y procesos académicos.')
add_bullet('Áreas de atención al cliente: Bancos, tiendas, hospitales y servicios de salud.')
add_para(
    'Esta situación ocurre porque la mayoría de personas no conocen lenguaje de señas, generando barreras de '
    'comunicación, problemas de inclusión, malentendidos y baja accesibilidad. La dependencia de intérpretes '
    'humanos es costosa, limitada en disponibilidad y no siempre accesible en el momento requerido.'
)

add_title('2.2 Justificación', level=2)
add_para('LexiSing es importante porque:')
add_bullet('Mejora la inclusión social y laboral de las personas con discapacidad auditiva.')
add_bullet('Facilita la comunicación accesible mediante tecnología innovadora.')
add_bullet('Reduce errores de interpretación al utilizar inteligencia artificial.')
add_bullet('Fortalece políticas de accesibilidad en las organizaciones.')
add_bullet('Mejora la atención al cliente al permitir comunicación directa y fluida.')
add_bullet('Promueve igualdad de oportunidades al eliminar barreras comunicativas.')
add_para(
    'Además, permite que las organizaciones modernicen sus procesos de atención inclusiva mediante tecnología '
    'inteligente, impulsando la transformación digital con enfoque humano.'
)

add_title('2.3 Alcance', level=2)
add_para('El sistema LexiSing incluye:', bold=True)
add_bullet('Autenticación de usuarios con múltiples proveedores (correo, Google, Microsoft).')
add_bullet('Reconocimiento de 33 señas de palabras en tiempo real mediante cámara.')
add_bullet('Reconocimiento de 27 letras del abecedario dactilológico LSC (modo deletreo).')
add_bullet('Léxico empresarial con 8 señas bimanuales adicionales.')
add_bullet('Formalización de texto mediante inteligencia artificial (Groq API).')
add_bullet('Chat en tiempo real entre usuarios con mensajes de texto.')
add_bullet('Edición y eliminación de mensajes.')
add_bullet('Gestión de usuarios con roles (admin, empleado, sordomudo, supervisor, usuario).')
add_bullet('Panel de administración con dashboard y estadísticas.')
add_bullet('Monitoreo de conversaciones con filtros por participante y fecha.')
add_bullet('Notificaciones sonoras de mensajes.')
add_bullet('Indicador de presencia online/offline.')
add_bullet('Registro de actividad de usuarios.')
add_bullet('Reglas de seguridad en Firestore con RBAC.')
add_bullet('Pipeline CI/CD con GitHub Actions.')

add_para('No incluye:', bold=True)
add_bullet('Aplicación móvil nativa (Android/iOS).')
add_bullet('Reconocimiento avanzado de señas complejas o expresiones regionales.')
add_bullet('Funcionamiento sin conexión a internet.')
add_bullet('Implementación masiva a nivel nacional en esta fase inicial.')

add_title('2.4 Limitaciones', level=2)
add_bullet('El reconocimiento de señas depende de la calidad de la cámara y las condiciones de iluminación.')
add_bullet('El vocabulario de señas reconocidas está limitado a 33 palabras, 27 letras y 8 términos empresariales.')
add_bullet('La formalización de texto mediante IA puede generar resultados inexactos con secuencias no coherentes.')
add_bullet('El sistema requiere conexión a internet para chat, autenticación y formalización con IA.')
add_bullet('Las letras ambiguas del abecedario pueden generar falsos positivos.')
add_bullet('No se implementó despliegue en servidor de producción.')
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# 3. OBJETIVOS
# ══════════════════════════════════════════════════════════════
add_title('3. OBJETIVOS', level=1)

add_title('3.1 Objetivo General', level=2)
add_para(
    'Desarrollar una plataforma web de comunicación inclusiva que permita la interacción entre personas sordas '
    'o mudas y usuarios oyentes mediante traducción de Lengua de Señas Colombiana (LSC) en tiempo real y '
    'mensajería digital.'
)

add_title('3.2 Objetivos Específicos', level=2)
add_bullet('Implementar autenticación segura de usuarios con múltiples proveedores mediante Firebase Authentication.')
add_bullet('Desarrollar un módulo de reconocimiento de señas en tiempo real utilizando MediaPipe HandLandmarker para 33 señas de palabras, 27 letras del abecedario dactilológico LSC y léxico empresarial.')
add_bullet('Implementar un servicio de formalización de texto mediante inteligencia artificial (Groq API) que convierta secuencias de glosas en español formal.')
add_bullet('Gestionar conversaciones y mensajes en tiempo real mediante Firebase Firestore con operaciones de creación, edición y eliminación.')
add_bullet('Implementar un sistema de roles y permisos (admin, empleado, sordomudo, supervisor, usuario) con reglas de seguridad en Firestore.')
add_bullet('Desarrollar un panel de administración y monitoreo con estadísticas de uso del sistema.')
add_bullet('Garantizar la accesibilidad y usabilidad de la interfaz web mediante Angular Material y diseño responsive.')
add_bullet('Implementar un pipeline de integración continua con GitHub Actions para build y verificación de código.')
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# 4. MARCO REFERENCIAL
# ══════════════════════════════════════════════════════════════
add_title('4. MARCO REFERENCIAL', level=1)

add_title('4.1 Marco Conceptual', level=2)

concepts = [
    ('Lengua de Señas Colombiana (LSC)',
     'Lengua natural utilizada por la comunidad sorda de Colombia como medio de comunicación. Se compone de señas manuales, expresiones faciales y corporales. El abecedario dactilológico LSC consta de 27 letras que se forman con configuraciones específicas de los dedos de la mano.'),
    ('Reconocimiento de Gestos',
     'Tecnología de visión por computador que permite detectar e interpretar movimientos y posiciones de la mano en tiempo real. En LexiSing, se utiliza para identificar señas de la LSC a partir de la cámara del dispositivo.'),
    ('MediaPipe HandLandmarker',
     'Framework de Google para la detección de manos en tiempo real. Extrae 21 landmarks (puntos de referencia) por mano, permitiendo hasta 2 manos simultáneas. Funciona directamente en el navegador (client-side) sin necesidad de servidor.'),
    ('Inteligencia Artificial para Formalización',
     'Uso de modelos de lenguaje para convertir secuencias de palabras clave (glosas) en texto gramaticalmente correcto. LexiSing utiliza la API de Groq con el modelo qwen/qwen3.8-27b para este propósito.'),
    ('Firebase',
     'Plataforma de desarrollo de aplicaciones de Google que ofrece servicios de autenticación (Firebase Authentication), base de datos en tiempo real (Firestore), y reglas de seguridad. Firestore es una base de datos NoSQL basada en documentos que permite sincronización en tiempo real.'),
    ('Angular',
     'Framework de desarrollo web de Google basado en TypeScript. LexiSing utiliza Angular 20.3 con Angular Material para la interfaz de usuario, SSR para rendimiento, y arquitectura basada en componentes.'),
    ('Django REST Framework',
     'Framework de Python para el desarrollo de APIs REST. LexiSing lo utiliza como backend para la formalización de texto y gestión de usuarios, con autenticación basada en Firebase ID tokens.'),
    ('Scrum',
     'Metodología ágil de gestión de proyectos que organiza el trabajo en ciclos iterativos llamados sprints. LexiSing fue desarrollado en 4 sprints de aproximadamente 2 semanas cada uno.'),
    ('RBAC (Role-Based Access Control)',
     'Modelo de control de acceso basado en roles que restringe el acceso a recursos del sistema según el rol asignado al usuario. LexiSing implementa 5 roles: admin, empleado, sordomudo, supervisor y usuario.'),
]

for title, desc in concepts:
    p = doc.add_paragraph()
    run_t = p.add_run(f'{title}: ')
    run_t.bold = True
    p.add_run(desc)

add_title('4.2 Marco Legal', level=2)

laws = [
    ('Ley 1581 de 2012 (Colombia)',
     'Por la cual se dictan disposiciones generales para la protección de datos personales. Establece los principios de legalidad, finalidad, libertad, veracidad, seguridad y confidencialidad en el tratamiento de datos personales. LexiSing cumple con esta ley al implementar reglas de seguridad en Firestore que restringen el acceso a datos personales según el rol del usuario.'),
    ('Ley 1346 de 2009 (Colombia)',
     'Por la cual se adopta la Convención sobre los Derechos de las Personas con Discapacidad y su Protocolo Facultativo. Esta ley obliga al Estado colombiano a garantizar el acceso a la tecnología asistiva y la accesibilidad digital para personas con discapacidad.'),
    ('Ley Estatutaria 1618 de 2013 (Colombia)',
     'Establece disposiciones para garantizar el ejercicio pleno de los derechos de las personas con discapacidad, incluyendo el derecho a la educación, el trabajo y la participación social.'),
    ('Normas MinTIC',
     'El Ministerio de Tecnologías de la Información y las Comunicaciones de Colombia establece directrices para la accesibilidad web y la transformación digital inclusiva.'),
    ('Convención Interamericana para la Eliminación de Todas las Formas de Discriminación contra las Personas con Discapacidad (1999)',
     'Colombia es signataria de esta convención que promueve la igualdad de oportunidades y la eliminación de barreras para personas con discapacidad.'),
]

for title, desc in laws:
    p = doc.add_paragraph()
    run_t = p.add_run(f'{title}: ')
    run_t.bold = True
    p.add_run(desc)
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# 5. ANÁLISIS DEL SISTEMA
# ══════════════════════════════════════════════════════════════
add_title('5. ANÁLISIS DEL SISTEMA', level=1)

add_title('5.1 Actores', level=2)
add_table(
    ['Actor', 'Descripción', 'Funciones principales'],
    [
        ['Administrador', 'Gestiona el sistema', 'Administra usuarios, reportes y configuraciones. Editar y eliminar usuarios.'],
        ['Empleado', 'Atención al público', 'Utiliza el traductor para comunicarse. Gestiona mensajes.'],
        ['Persona sorda o muda', 'Usuario principal', 'Realiza señas reconocidas por cámara. Envía y recibe mensajes.'],
        ['Supervisor', 'Monitoreo', 'Consulta reportes y estadísticas. Monitorea conversaciones.'],
        ['Sistema IA', 'Motor de IA', 'Interpreta señas y genera traducciones formales mediante Groq API.'],
    ]
)

add_title('5.2 Requerimientos Funcionales', level=2)
add_table(
    ['Código', 'Actor', 'Requerimiento', 'Descripción'],
    [
        ['RF01', 'Persona sorda', 'Gestionar Mensajes', 'Enviar, editar, eliminar y recibir mensajes'],
        ['RF02', 'Empleado', 'Gestionar Mensajes', 'Enviar, editar, eliminar y recibir mensajes'],
        ['RF03', 'Administrador', 'Gestionar usuarios', 'Editar y eliminar usuarios del sistema'],
        ['RF04', 'Supervisor', 'Generar reportes', 'Consultar estadísticas y reportes de actividad'],
        ['RF05', 'Empleado', 'Iniciar sesión', 'Acceder con credenciales (correo, Google, Microsoft)'],
        ['RF06', 'Usuario', 'Consultar historial', 'Revisar conversaciones y mensajes anteriores'],
        ['RF07', 'Usuario', 'Cerrar sesión', 'Salir del sistema de forma segura'],
        ['RF08', 'Persona sorda', 'Grabar Señas', 'Capturar video y reconocer gestos en tiempo real'],
        ['RF09', 'Persona sorda', 'Formalizar texto', 'Convertir glosas en texto formal mediante IA'],
        ['RF10', 'Supervisor', 'Monitorear conversaciones', 'Visualizar con filtros por participante y fecha'],
        ['RF11', 'Administrador', 'Controlar permisos', 'Asignar y modificar roles de usuarios'],
        ['RF12', 'Usuario', 'Recuperar contraseña', 'Restablecer contraseña en caso de olvido'],
    ]
)

add_title('5.3 Requerimientos No Funcionales', level=2)
add_table(
    ['Código', 'Categoría', 'Requerimiento', 'Descripción'],
    [
        ['RNF1', 'Seguridad', 'Protección de datos', 'Cumplimiento Ley 1581 de 2012'],
        ['RNF2', 'Rendimiento', 'Tiempo de respuesta', 'Formalización < 15s; chat latencia < 300ms'],
        ['RNF3', 'Usabilidad', 'Interfaz intuitiva', 'Diseño accesible para cualquier usuario'],
        ['RNF4', 'Disponibilidad', 'Alta disponibilidad', 'Sistema activo mínimo 95%'],
        ['RNF5', 'Compatibilidad', 'Multiplataforma', 'Chrome, Firefox, Edge, Safari'],
        ['RNF6', 'Accesibilidad', 'Diseño inclusivo', 'Navegación accesible con indicadores visuales'],
        ['RNF7', 'Seguridad', 'Autenticación robusta', 'Firebase Auth con JWT y refresh tokens'],
        ['RNF8', 'Escalabilidad', 'Arquitectura cloud', 'Firebase Firestore con escalabilidad automática'],
    ]
)

add_title('5.4 Casos de Uso', level=2)

use_cases = [
    ('Caso de Uso 1: Iniciar sesión',
     'Cualquier usuario',
     'El usuario debe tener una cuenta registrada',
     ['El usuario accede a la página de inicio de sesión.',
      'Ingresa credenciales (correo/contraseña) o selecciona proveedor (Google/Microsoft).',
      'El sistema valida las credenciales con Firebase Authentication.',
      'El sistema redirige al usuario a la vista correspondiente según su rol.'],
     ['Si las credenciales son inválidas, el sistema muestra un mensaje de error.',
      'Si el usuario no tiene cuenta, puede registrarse.',
      'Si olvidó la contraseña, puede recuperarla.']),
    ('Caso de Uso 2: Grabar y traducir señas',
     'Persona sorda o muda',
     'El usuario debe tener una cámara disponible y haber iniciado sesión',
     ['El usuario activa la cámara en la vista de chat.',
      'Selecciona el modo de reconocimiento (Palabras o Deletreo).',
      'Realiza las señas frente a la cámara.',
      'MediaPipe HandLandmarker detecta los landmarks de la mano.',
      'El sistema clasifica la seña y la agrega como chip o letra.',
      'El usuario presiona "Formalizar" para enviar la secuencia a la IA.',
      'Groq API convierte las glosas en texto formal.',
      'El texto formal se envía como mensaje en el chat.'],
     ['Si la cámara no está disponible, el sistema muestra un error.',
      'Si la IA no responde, se utiliza el fallback (unión de palabras con espacios).']),
    ('Caso de Uso 3: Gestionar mensajes',
     'Persona sorda o empleado',
     'El usuario debe tener una conversación activa',
     ['El usuario escribe un mensaje o genera uno desde señas.',
      'Envía el mensaje a la conversación.',
      'El mensaje se almacena en Firestore y se entrega en tiempo real.',
      'El usuario puede editar o eliminar mensajes propios.'],
     ['Si el usuario intenta editar un mensaje ajeno, el sistema lo rechaza.']),
    ('Caso de Uso 4: Consultar historial',
     'Cualquier usuario autenticado',
     'El usuario debe tener conversaciones previas',
     ['El usuario accede a la lista de conversaciones.',
      'Selecciona una conversación.',
      'El sistema carga los mensajes ordenados cronológicamente.',
      'El usuario puede revisar mensajes anteriores con scroll.'],
     []),
    ('Caso de Uso 5: Generar reportes y estadísticas',
     'Supervisor',
     'El usuario debe tener rol de supervisor',
     ['El supervisor accede al módulo de reportes.',
      'Selecciona el tipo de reporte.',
      'El sistema genera las estadísticas y las muestra en gráficos.',
      'El supervisor puede filtrar por participante y fecha.'],
     ['Si ocurre un error en la generación, el sistema muestra un mensaje controlado.']),
    ('Caso de Uso 6: Cerrar sesión',
     'Cualquier usuario',
     'El usuario debe tener una sesión activa',
     ['El usuario presiona el botón de cerrar sesión.',
      'El sistema limpia la sesión de Firebase Auth y localStorage.',
      'El sistema redirige a la página de inicio de sesión.'],
     []),
]

for cu_title, actor, precond, flow, alt_flow in use_cases:
    p = doc.add_paragraph()
    run_t = p.add_run(cu_title)
    run_t.bold = True
    add_para(f'Actor principal: {actor}')
    add_para(f'Precondiciones: {precond}')
    add_para('Flujo principal:', bold=True)
    for i, step in enumerate(flow, 1):
        add_para(f'{i}. {step}')
    if alt_flow:
        add_para('Flujo alterno:', bold=True)
        for alt in alt_flow:
            add_bullet(alt)
    doc.add_paragraph()

add_title('5.5 Historias de Usuario', level=2)
hu_data = [
    ['HU01', 'Como usuario, quiero iniciar sesión en el sistema para acceder de manera segura a mis conversaciones.'],
    ['HU02', 'Como persona sorda, quiero grabar mensajes en lenguaje de señas para comunicarme con otras personas.'],
    ['HU03', 'Como persona sorda, quiero enviar mensajes grabados para compartir información de manera clara.'],
    ['HU04', 'Como persona sorda, quiero editar mensajes enviados para corregir errores.'],
    ['HU05', 'Como persona sorda, quiero eliminar mensajes para administrar mejor mis conversaciones.'],
    ['HU06', 'Como empleado, quiero recibir mensajes traducidos para comprender las solicitudes de los usuarios sordos.'],
    ['HU07', 'Como empleado, quiero gestionar mensajes recibidos para mantener una comunicación organizada.'],
    ['HU08', 'Como usuario, quiero cerrar sesión de forma segura para proteger mi información personal.'],
    ['HU09', 'Como usuario, quiero consultar el historial de conversaciones para revisar mensajes anteriores.'],
    ['HU10', 'Como administrador, quiero editar información de usuarios para mantener los datos actualizados.'],
    ['HU11', 'Como administrador, quiero eliminar usuarios para controlar el acceso al sistema.'],
    ['HU12', 'Como supervisor, quiero generar reportes para monitorear el funcionamiento del sistema.'],
    ['HU13', 'Como supervisor, quiero consultar estadísticas de actividad para evaluar el uso de la plataforma.'],
    ['HU14', 'Como usuario, quiero recuperar mi contraseña para volver a acceder al sistema.'],
    ['HU15', 'Como persona sorda, quiero recibir mensajes dentro de la plataforma para mantener conversaciones activas.'],
    ['HU16', 'Como empleado, quiero responder mensajes recibidos para continuar la comunicación.'],
    ['HU17', 'Como supervisor, quiero monitorear la actividad de los usuarios para verificar el uso correcto.'],
    ['HU18', 'Como administrador, quiero controlar permisos de acceso para garantizar la seguridad del sistema.'],
]
add_table(['ID', 'Historia de usuario'], hu_data)

add_title('5.6 Product Backlog', level=2)
add_table(
    ['Prioridad', 'ID', 'Funcionalidad', 'Módulo'],
    [
        ['Alta', 'HU01', 'Inicio de sesión', 'Autenticación'],
        ['Alta', 'HU02', 'Grabación de señas', 'Cámara'],
        ['Alta', 'HU03', 'Envío de mensajes', 'Comunicación'],
        ['Alta', 'HU06', 'Recepción de mensajes', 'Comunicación'],
        ['Alta', 'HU07', 'Gestión de mensajes', 'Mensajería'],
        ['Alta', 'HU08', 'Cierre de sesión', 'Seguridad'],
        ['Alta', 'HU09', 'Historial', 'Historial'],
        ['Alta', 'HU15', 'Recepción de mensajes', 'Comunicación'],
        ['Media', 'HU10', 'Edición de usuarios', 'Administración'],
        ['Media', 'HU11', 'Eliminación de usuarios', 'Administración'],
        ['Media', 'HU12', 'Generación de reportes', 'Reportes'],
        ['Media', 'HU13', 'Consulta de estadísticas', 'Reportes'],
        ['Media', 'HU16', 'Respuesta a mensajes', 'Comunicación'],
        ['Baja', 'HU14', 'Recuperación de contraseña', 'Seguridad'],
        ['Baja', 'HU17', 'Monitoreo de actividad', 'Supervisión'],
        ['Baja', 'HU18', 'Gestión de permisos', 'Seguridad'],
    ]
)

add_title('5.7 MVP Definido', level=2)
add_para(
    'El MVP (Producto Mínimo Viable) de LexiSing está enfocado en validar la experiencia principal del usuario: '
    'permitir una comunicación básica entre una persona sorda y un empleado mediante traducción de señas y texto.'
)
add_table(
    ['Funcionalidad', 'Descripción'],
    [
        ['Inicio de sesión', 'Ingreso al sistema mediante credenciales seguras (correo, Google, Microsoft).'],
        ['Cierre de sesión', 'Finalización segura de sesiones activas.'],
        ['Grabación de señas', 'Captura de mensajes mediante cámara con reconocimiento MediaPipe.'],
        ['Envío de mensajes', 'Envío de mensajes dentro de conversaciones activas.'],
        ['Recepción de mensajes', 'Recepción de mensajes en tiempo real.'],
        ['Edición de mensajes', 'Modificación de mensajes enviados previamente.'],
        ['Eliminación de mensajes', 'Eliminación de mensajes dentro de conversaciones.'],
        ['Historial', 'Almacenamiento de conversaciones para consultas posteriores.'],
        ['Reportes básicos', 'Visualización de reportes de actividad por el supervisor.'],
        ['Gestión de conversaciones', 'Organización de mensajes enviados y recibidos.'],
    ]
)
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# 6. DISEÑO DEL SISTEMA
# ══════════════════════════════════════════════════════════════
add_title('6. DISEÑO DEL SISTEMA', level=1)

add_title('6.1 Arquitectura del Sistema', level=2)
add_para(
    'LexiSing implementa una arquitectura de tres capas (frontend, backend, servicios cloud) con separación '
    'de responsabilidades:'
)
add_para('Frontend (Angular 20.3):', bold=True)
add_bullet('Arquitectura basada en componentes con lazy loading de rutas.')
add_bullet('Angular Material para componentes de interfaz.')
add_bullet('MediaPipe HandLandmarker para reconocimiento de señas (client-side).')
add_bullet('Firebase Angular Fire para conexión directa con Firestore.')
add_bullet('SSR (Server-Side Rendering) para mejorar rendimiento y SEO.')

add_para('Backend (Django 6.0 + DRF 3.17):', bold=True)
add_bullet('API REST para formalización de texto con IA.')
add_bullet('Autenticación basada en Firebase ID tokens.')
add_bullet('Servicio GroqService para integración con Groq API.')
add_bullet('Arquitectura modular con apps independientes (users, text).')

add_para('Servicios Cloud (Firebase + Google Cloud):', bold=True)
add_bullet('Firebase Authentication para autenticación multi-proveedor.')
add_bullet('Firebase Firestore para base de datos NoSQL en tiempo real.')
add_bullet('Firebase Hosting para despliegue del frontend.')
add_bullet('Reglas de seguridad Firestore con RBAC.')

add_title('6.2 Diagrama de Componentes', level=2)
add_placeholder('(Incluir diagrama de componentes del sistema mostrando las capas Frontend, Backend y Servicios Cloud)')
doc.add_paragraph()

add_title('6.3 Modelo Entidad Relación (MER) — Firestore Collections', level=2)
add_para(
    'Firestore es una base de datos NoSQL basada en documentos. A continuación se describe la estructura de '
    'colecciones y documentos:'
)
add_para('Colección: usuarios', bold=True)
add_table(
    ['Campo', 'Tipo', 'Descripción', 'Restricción'],
    [
        ['uid', 'string', 'Identificador único (Firebase Auth)', 'Obligatorio, único'],
        ['nombre', 'string', 'Nombre completo', 'Obligatorio, máx. 150 caracteres'],
        ['email', 'string', 'Correo electrónico', 'Obligatorio, único'],
        ['rol', 'string', 'Rol del usuario', 'Obligatorio, enum: admin, empleado, sordomudo, supervisor, usuario'],
        ['photoURL', 'string', 'Foto de perfil (base64)', 'Opcional'],
        ['activo', 'boolean', 'Estado de la cuenta', 'Obligatorio, default: true'],
        ['creado', 'timestamp', 'Fecha de creación', 'Automático'],
    ]
)

add_para('Colección: conversaciones', bold=True)
add_table(
    ['Campo', 'Tipo', 'Descripción', 'Restricción'],
    [
        ['participants', 'array<string>', 'UIDs de los participantes', 'Obligatorio, mín. 2'],
        ['lastMessage', 'string', 'Último mensaje', 'Opcional'],
        ['updatedAt', 'timestamp', 'Última actualización', 'Automático'],
    ]
)

add_para('Subcolección: mensajes', bold=True)
add_table(
    ['Campo', 'Tipo', 'Descripción', 'Restricción'],
    [
        ['senderUid', 'string', 'UID del remitente', 'Obligatorio'],
        ['senderName', 'string', 'Nombre del remitente', 'Obligatorio'],
        ['content', 'string', 'Contenido del mensaje', 'Obligatorio'],
        ['timestamp', 'timestamp', 'Fecha y hora', 'Automático'],
        ['edited', 'boolean', 'Mensaje editado', 'Default: false'],
        ['deleted', 'boolean', 'Mensaje eliminado', 'Default: false'],
    ]
)

add_para('Colección: activities', bold=True)
add_table(
    ['Campo', 'Tipo', 'Descripción', 'Restricción'],
    [
        ['uid', 'string', 'UID del usuario', 'Obligatorio'],
        ['userName', 'string', 'Nombre del usuario', 'Obligatorio'],
        ['action', 'string', 'Acción realizada', 'Obligatorio'],
        ['timestamp', 'timestamp', 'Fecha y hora', 'Automático'],
    ]
)

add_title('6.4 Diccionario de Datos', level=2)
add_placeholder('(El diccionario de datos se encuentra detallado en la sección 6.3 con la estructura completa de colecciones Firestore)')

add_title('6.5 Wireframes', level=2)
add_placeholder('(Incluir capturas de pantalla de las principales vistas del sistema: login, dashboard, chat con cámara, monitoreo, gestión de usuarios)')

add_title('6.6 Flujo de Navegación', level=2)
add_para('Flujo de navegación principal:', bold=True)
add_bullet('Página de Inicio → Login (correo, Google, Microsoft) → Redirección por Rol')
add_bullet('admin → /roles/admin/dashboard')
add_bullet('empleado → /roles/empleados/dashboard')
add_bullet('sordomudo → /roles/sordomudo/dashboard')
add_bullet('supervisor → /roles/supervisor/dashboard')
add_bullet('usuario → /roles/usuario')
add_bullet('Dashboard → Chat/Conversaciones → Vista de Chat (cámara + mensajes)')
add_bullet('Dashboard → Admin/Usuarios → Gestión de usuarios')
add_bullet('Dashboard → Reportes/Monitoreo → Estadísticas y filtros')
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# 7. IMPLEMENTACIÓN DEL PROYECTO
# ══════════════════════════════════════════════════════════════
add_title('7. IMPLEMENTACIÓN DEL PROYECTO', level=1)

add_title('7.1 Configuración del Entorno', level=2)
add_table(
    ['Componente', 'Tecnología', 'Versión'],
    [
        ['Runtime Backend', 'Python', '3.14'],
        ['Framework Backend', 'Django', '6.0.5'],
        ['API REST', 'Django REST Framework', '3.17.1'],
        ['Runtime Frontend', 'Node.js', '20+'],
        ['Framework Frontend', 'Angular CLI', '20.3.27'],
        ['TypeScript', 'TypeScript', '5.9.2'],
        ['Base de datos', 'Firebase Firestore', 'NoSQL'],
        ['Autenticación', 'Firebase Authentication', '-'],
        ['IA', 'Groq API', '-'],
        ['Control de versiones', 'Git', '-'],
        ['CI/CD', 'GitHub Actions', '-'],
    ]
)

add_title('7.2 Estructura del Proyecto', level=2)
structure = """LexiSing/
├── back_lexiSing/                    # Backend Django + DRF
│   ├── lexising/                     # Configuración del proyecto
│   │   ├── settings.py
│   │   └── urls.py
│   ├── app/core/                     # Módulo core
│   │   ├── authentication.py        # FirebaseAuthentication
│   │   └── firebase.py             # Inicialización Firebase
│   ├── users/                        # App: gestión de usuarios
│   │   ├── models.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── text/                         # App: formalización con IA
│   │   ├── serializers.py
│   │   ├── services.py             # GroqService
│   │   ├── views.py
│   │   └── urls.py
│   ├── requirements.txt
│   └── firebase-key.json
├── front-lexi-sing/                  # Frontend Angular 20
│   └── src/app/
│       ├── core/
│       │   ├── services/            # 11 servicios Angular
│       │   ├── guards/              # auth, role
│       │   ├── interceptors/        # Firebase token
│       │   └── models/
│       └── features/
│           ├── auth/                # Login, register, forgot-password
│           ├── chat/                # conversation-list + chat
│           ├── dashboard/
│           └── roles/               # admin, empleado, sordomudo, supervisor
├── .github/workflows/ci.yml
└── README.md"""
p = doc.add_paragraph()
run = p.add_run(structure)
run.font.name = 'Courier New'
run.font.size = Pt(8)

add_title('7.3 Implementación de Base de Datos', level=2)
add_para(
    'La base de datos principal es Firebase Firestore (NoSQL). El backend Django también utiliza SQLite para '
    'el modelo UserProfile, pero la lógica principal de datos opera sobre Firestore.'
)
add_para('Colecciones Firestore:', bold=True)
add_bullet('usuarios — Almacena perfiles de usuario con roles y datos básicos.')
add_bullet('conversaciones — Almacena metadatos de conversaciones.')
add_bullet('conversaciones/{convId}/mensajes — Subcolección con mensajes.')
add_bullet('activities — Registro de actividad de usuarios.')

add_para('Reglas de seguridad Firestore:', bold=True)
add_bullet('Los usuarios autenticados pueden leer perfiles de otros usuarios.')
add_bullet('Un usuario solo puede crear su propio perfil con rol inicial "usuario".')
add_bullet('Un usuario solo puede editar campos inofensivos en su propio perfil.')
add_bullet('Admin/supervisor pueden editar y eliminar cualquier usuario.')
add_bullet('Las conversaciones son visibles solo para sus participantes.')
add_bullet('Los mensajes solo pueden ser escritos por participantes de la conversación.')

add_title('7.4 Definición de API', level=2)
add_para('Endpoints del Backend Django:', bold=True)
add_table(
    ['Método', 'Endpoint', 'Auth', 'Descripción'],
    [
        ['GET', '/api/health/', 'No', 'Health check del backend'],
        ['GET', '/api/users/me/', 'Sí', 'Perfil del usuario autenticado'],
        ['GET', '/api/users/', 'No', 'Lista de todos los usuarios'],
        ['GET/POST', '/api/conversations/', 'Sí', 'Listar/crear conversaciones'],
        ['POST', '/api/text/formalize/', 'Sí', 'Formalizar glosas con IA'],
    ]
)

add_para('Servicios Frontend (Angular):', bold=True)
add_table(
    ['Servicio', 'Responsabilidad'],
    [
        ['AuthService', 'Autenticación Firebase, persistencia de sesión, roles'],
        ['SignLanguageService', 'Detección de señas LSC con MediaPipe'],
        ['CameraService', 'Captura de cámara WebRTC (getUserMedia)'],
        ['TextFormalizerService', 'Llamada a /api/text/formalize/'],
        ['ConversationService', 'CRUD de conversaciones y mensajes en Firestore'],
        ['NotificationService', 'Notificaciones sonoras de mensajes entrantes'],
        ['PresenceService', 'Indicador de presencia online/offline'],
        ['ActivityService', 'Registro de actividad de usuarios'],
        ['DashboardService', 'Datos para el panel de administración'],
        ['UserApiService', 'Cliente HTTP para APIs de usuarios'],
    ]
)

add_title('7.5 Desarrollo por Sprint', level=2)

sprints = [
    ('Sprint 1: Fundamentos y Autenticación (Junio 2026)',
     'Establecer la infraestructura del proyecto, autenticación de usuarios y chat básico.',
     ['Proyecto Angular 20 configurado con SSR',
      'Proyecto Django 6.0 con DRF configurado',
      'Firebase Authentication funcionando (correo)',
      'Login y registro de usuarios',
      'Dashboard básico',
      'Chat con mensajes en tiempo real (Firestore)',
      'Cámara integrada en la vista de chat',
      'Panel de supervisor con navegación'],
     ['551a3e7', 'ef35b91', 'a36d001', '619dab6', '8f105c6', '6433dc1', '41bea40'],
     '2 semanas'),
    ('Sprint 2: Roles y Gestión de Usuarios (Julio 2026)',
     'Implementar sistema de roles, gestión de usuarios y paneles específicos por rol.',
     ['5 roles implementados (admin, empleado, sordomudo, supervisor, usuario)',
      'Guards de autenticación y roles en rutas',
      'Edición y eliminación de mensajes',
      'Contador de usuarios en línea',
      'Panel de administración con gestión de usuarios',
      'Panel de sordomudo con diseño específico',
      'Configuración de perfil por rol'],
     ['329dfdd', 'c1f6a78', 'c6e2bcd', '45beb57', 'a1ac833', '7ae28cb'],
     '2 semanas'),
    ('Sprint 3: Reconocimiento de Señas e IA (Agosto 2026)',
     'Implementar el reconocimiento de señas en tiempo real y la formalización de texto con IA.',
     ['Reconocimiento de señas con MediaPipe HandLandmarker (24 gestos)',
      'Detección de dos manos y gestos bimanuales',
      'Detección de movimiento (ondeo, apuntar)',
      'Modo práctica con visualización de gestos',
      'Integración con Groq API para formalización de texto',
      'Fallback automático si la IA no está disponible',
      'Autenticación con Google y Microsoft',
      'Optimización de gráficos del supervisor'],
     ['a4f71c2', '6ff2c0f', '67b848c', '232c487', '205a059', 'e3ee3ce'],
     '2 semanas'),
    ('Sprint 4: LSC Completo, Notificaciones y Monitoreo (Septiembre 2026)',
     'Completar el abecedario LSC, implementar léxico empresarial, notificaciones y monitoreo.',
     ['Abecedario dactilológico LSC completo (27 letras)',
      'Letras con movimiento (J, Z) con detección de trayectoria',
      'Letras ambiguas con retención extendida (A, E, S, M, N, Ñ, O, R)',
      'Léxico empresarial (Reunión, Informe, Cliente, Pausa, Aprobar, Enviar, Trabajar, Pedir)',
      'Notificaciones sonoras de mensajes entrantes',
      'Filtros de monitoreo (búsqueda, participante, fecha)',
      'Rediseño de monitoreo con estética violeta/índigo',
      'Corrección de 9 errores documentados'],
     ['9797ad6', '96b977f', '1debf7b', '5bf1171', 'b30a4cc', '049fcb1'],
     '2 semanas'),
]

for s_title, objective, deliverables, commits, duration in sprints:
    p = doc.add_paragraph()
    run_t = p.add_run(s_title)
    run_t.bold = True
    add_para(f'Objetivo: {objective}')
    add_para('Entregables:', bold=True)
    for d in deliverables:
        add_bullet(d)
    add_para(f'Commits principales: {", ".join(commits)}')
    add_para(f'Duración: {duration}')
    doc.add_paragraph()
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# 8. PRUEBAS DEL SISTEMA
# ══════════════════════════════════════════════════════════════
add_title('8. PRUEBAS DEL SISTEMA', level=1)

add_title('8.1 Plan de Pruebas', level=2)
add_table(
    ['ID', 'Tipo', 'Descripción', 'Estado'],
    [
        ['P01', 'Funcional', 'Inicio de sesión con correo', '(Estado)'],
        ['P02', 'Funcional', 'Inicio de sesión con Google', '(Estado)'],
        ['P03', 'Funcional', 'Inicio de sesión con Microsoft', '(Estado)'],
        ['P04', 'Funcional', 'Registro de usuario', '(Estado)'],
        ['P05', 'Funcional', 'Recuperación de contraseña', '(Estado)'],
        ['P06', 'Funcional', 'Reconocimiento de señas (modo palabras)', '(Estado)'],
        ['P07', 'Funcional', 'Reconocimiento de señas (modo deletreo)', '(Estado)'],
        ['P08', 'Funcional', 'Formalización de texto con IA', '(Estado)'],
        ['P09', 'Funcional', 'Envío de mensajes', '(Estado)'],
        ['P10', 'Funcional', 'Edición de mensajes', '(Estado)'],
        ['P11', 'Funcional', 'Eliminación de mensajes', '(Estado)'],
        ['P12', 'Funcional', 'Creación de conversaciones', '(Estado)'],
        ['P13', 'Funcional', 'Gestión de usuarios (admin)', '(Estado)'],
        ['P14', 'Funcional', 'Monitoreo de conversaciones (supervisor)', '(Estado)'],
        ['P15', 'Funcional', 'Generación de reportes', '(Estado)'],
        ['P16', 'Seguridad', 'RBAC - Acceso por roles', '(Estado)'],
        ['P17', 'Seguridad', 'Reglas Firestore', '(Estado)'],
        ['P18', 'Usabilidad', 'Navegación general', '(Estado)'],
        ['P19', 'Rendimiento', 'Tiempo de respuesta chat', '(Estado)'],
        ['P20', 'Compatibilidad', 'Navegadores Chrome, Firefox, Edge', '(Estado)'],
    ]
)

add_title('8.2 Diseño de Casos de Prueba', level=2)
add_table(
    ['ID', 'Caso de prueba', 'Resultado esperado', 'Resultado real'],
    [
        ['CP01', 'Login exitoso con correo', 'Redirección al dashboard del rol', '(Resultado)'],
        ['CP02', 'Login fallido', 'Mensaje de error', '(Resultado)'],
        ['CP03', 'Registro exitoso', 'Cuenta creada, redirección a login', '(Resultado)'],
        ['CP04', 'Envío de mensaje', 'Mensaje aparece en tiempo real', '(Resultado)'],
        ['CP05', 'Edición de mensaje', 'Mensaje actualizado con "editado"', '(Resultado)'],
        ['CP06', 'Eliminación de mensaje', 'Mensaje reemplazado por "eliminado"', '(Resultado)'],
        ['CP07', 'Creación de conversación', 'Conversación creada sin duplicados', '(Resultado)'],
        ['CP08', 'Reconocimiento seña "Hola"', 'Seña detectada y confirmada', '(Resultado)'],
        ['CP09', 'Formalización de texto', 'Texto formal generado', '(Resultado)'],
        ['CP10', 'Acceso no autorizado', 'Redirección a vista del rol actual', '(Resultado)'],
    ]
)

add_title('8.3 Pruebas Manuales', level=2)
add_placeholder('(Incluir evidencias de pruebas manuales realizadas con capturas de pantalla)')
add_bullet('Pruebas de flujo completo de autenticación (login, registro, recuperación, logout).')
add_bullet('Pruebas de reconocimiento de señas con diferentes condiciones de iluminación.')
add_bullet('Pruebas de chat en tiempo real entre dos usuarios.')
add_bullet('Pruebas de gestión de mensajes (envío, edición, eliminación).')
add_bullet('Pruebas de acceso por roles (RBAC).')
add_bullet('Pruebas de navegación en diferentes navegadores.')

add_title('8.4 Pruebas Automatizadas', level=2)
add_para(
    'El proyecto actualmente cuenta con un pipeline CI/CD con GitHub Actions que ejecuta:'
)
add_bullet('Build del frontend Angular (npm run build).')
add_bullet('Verificación de sintaxis del backend Django (python manage.py check).')
add_bullet('Lint del frontend (cuando esté configurado).')
add_para(
    'Las pruebas unitarias, de integración y E2E quedan como trabajo futuro pendiente.'
)

add_title('8.5 Gestión de Incidencias', level=2)
add_table(
    ['ID', 'Incidencia', 'Severidad', 'Estado'],
    [
        ['E01', 'Alerta de confirmar contraseña visible al cargar', 'Alta', 'Resuelto'],
        ['E02', 'No se puede revisar contraseña escrita', 'Media', 'Resuelto'],
        ['E03', 'Estadísticas muestran todos los mensajes sin filtrar', 'Alta', 'Resuelto'],
        ['E04', 'Chat requiere scroll para escribir', 'Alta', 'Resuelto'],
        ['E05', 'Mensajes exceden ancho máximo', 'Alta', 'Resuelto'],
        ['E06', 'Foto de perfil no visible para otros', 'Media', 'Parcial'],
        ['E07', 'Conversaciones infinitas con misma persona', 'Alta', 'Resuelto'],
        ['E08', 'Sesión no persiste al cerrar navegador', 'Alta', 'Implementado'],
        ['E09', 'Supervisor sin filtros en monitoreo', 'Media', 'Resuelto'],
    ]
)

add_title('8.6 Evidencias de Ejecución', level=2)
add_placeholder('(Incluir capturas de pantalla de: login exitoso, chat funcionando, reconocimiento de señas con landmarks, panel de administración, monitoreo del supervisor)')
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# 9. DESPLIEGUE DEL SISTEMA
# ══════════════════════════════════════════════════════════════
add_title('9. DESPLIEGUE DEL SISTEMA', level=1)

add_title('9.1 Arquitectura de Despliegue', level=2)
add_para('El sistema actualmente funciona en entorno de desarrollo local:')
add_bullet('Frontend Angular: http://localhost:4200')
add_bullet('Backend Django: http://localhost:8000')
add_bullet('Firebase Cloud: Auth + Firestore + Hosting')
add_bullet('Groq Cloud: IA para formalización de texto')

add_title('9.2 Servicios Utilizados', level=2)
add_table(
    ['Servicio', 'Proveedor', 'Función'],
    [
        ['Firebase Authentication', 'Google Cloud', 'Autenticación multi-proveedor'],
        ['Firebase Firestore', 'Google Cloud', 'Base de datos NoSQL en tiempo real'],
        ['Firebase Hosting', 'Google Cloud', 'Hosting del frontend Angular'],
        ['Groq API', 'Groq Cloud', 'Formalización de texto con IA'],
        ['GitHub Actions', 'GitHub', 'CI/CD (build y verificación)'],
        ['MediaPipe', 'Google (client-side)', 'Detección de manos y landmarks'],
    ]
)

add_title('9.3 Configuración del Entorno Productivo', level=2)
add_placeholder('(Pendiente: Configurar despliegue en Firebase Hosting para el frontend y un servicio de hosting para el backend)')

add_title('9.4 URL del Sistema', level=2)
add_placeholder('(Pendiente: Incluir URL de producción una vez se realice el despliegue)')

add_title('9.5 Evidencias de Funcionamiento', level=2)
add_placeholder('(Incluir capturas de la aplicación funcionando en el navegador)')
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# 10. COSTOS
# ══════════════════════════════════════════════════════════════
add_title('10. COSTOS', level=1)

add_title('10.1 Estimación de Costos', level=2)
add_table(
    ['Servicio', 'Costo mensual estimado'],
    [
        ['Firebase (Auth + Firestore + Hosting)', 'Gratis en tier gratuito (Spark plan)'],
        ['Groq API', 'Gratis en tier gratuito'],
        ['GitHub Actions', 'Gratis para repos públicos'],
        ['Dominio (opcional)', '(Costo si se adquiere dominio)'],
        ['Total mensual', '$0 USD (durante fase de desarrollo/pruebas)'],
    ]
)
add_para(
    'Nota: Los costos pueden incrementar al escalar a producción con tráfico real. Firebase cobra por '
    'lecturas/escrituras en Firestore y por hosting si se excede el tier gratuito.'
)
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# 11. RESULTADOS OBTENIDOS
# ══════════════════════════════════════════════════════════════
add_title('11. RESULTADOS OBTENIDOS', level=1)

add_title('11.1 Cumplimiento de Objetivos', level=2)
add_table(
    ['Objetivo', 'Estado'],
    [
        ['Autenticación segura con múltiples proveedores', '✅ Cumplido'],
        ['Módulo de reconocimiento de señas (33 palabras + 27 letras)', '✅ Cumplido'],
        ['Servicio de formalización de texto con IA', '✅ Cumplido'],
        ['Gestión de conversaciones y mensajes en tiempo real', '✅ Cumplido'],
        ['Sistema de roles y permisos', '✅ Cumplido'],
        ['Panel de administración y monitoreo', '✅ Cumplido'],
        ['Accesibilidad y usabilidad', '✅ Cumplido'],
        ['CI/CD con GitHub Actions', '✅ Cumplido'],
    ]
)

add_title('11.2 Funcionalidades Implementadas', level=2)
add_table(
    ['Funcionalidad', 'Estado'],
    [
        ['Inicio de sesión (correo, Google, Microsoft)', '✅'],
        ['Registro de usuarios', '✅'],
        ['Recuperación de contraseña', '✅'],
        ['Reconocimiento de 33 señas de palabras', '✅'],
        ['Abecedario dactilológico LSC (27 letras)', '✅'],
        ['Léxico empresarial (8 señas bimanuales)', '✅'],
        ['Formalización de texto con IA (Groq API)', '✅'],
        ['Chat en tiempo real', '✅'],
        ['Edición de mensajes', '✅'],
        ['Eliminación de mensajes', '✅'],
        ['Gestión de conversaciones', '✅'],
        ['Prevención de conversaciones duplicadas', '✅'],
        ['Notificaciones sonoras', '✅'],
        ['Presencia online/offline', '✅'],
        ['Panel de administración', '✅'],
        ['Gestión de usuarios (admin)', '✅'],
        ['Monitoreo de conversaciones (supervisor)', '✅'],
        ['Filtros de búsqueda y fecha', '✅'],
        ['Registro de actividad', '✅'],
        ['Reglas de seguridad Firestore (RBAC)', '✅'],
        ['CI/CD con GitHub Actions', '✅'],
        ['Modo palabras y modo deletreo', '✅'],
        ['Detección de dos manos', '✅'],
        ['Detección de movimiento (ondeo, apuntar)', '✅'],
        ['Letras con movimiento (J, Z)', '✅'],
        ['Retención extendida para letras ambiguas', '✅'],
        ['Visualización de landmarks en canvas', '✅'],
        ['Banner de "mano no detectada"', '✅'],
    ]
)

add_title('11.3 Beneficios Obtenidos', level=2)
add_para('Beneficios sociales:', bold=True)
add_bullet('Herramienta funcional para la comunicación entre personas sordas y oyentes.')
add_bullet('Promoción de la inclusión social y laboral de personas con discapacidad auditiva.')
add_bullet('Sensibilización sobre la importancia de la accesibilidad digital.')

add_para('Beneficios tecnológicos:', bold=True)
add_bullet('Aplicación de inteligencia artificial y visión por computador para resolver un problema social.')
add_bullet('Integración de tecnologías modernas (Angular 20, Django 6, Firebase, MediaPipe).')
add_bullet('Desarrollo de un clasificador de señas basado en reglas geométricas.')

add_para('Beneficios educativos:', bold=True)
add_bullet('Experiencia de desarrollo de software con metodología ágil (Scrum).')
add_bullet('Aprendizaje de arquitectura de software escalable.')
add_bullet('Aplicación de conceptos de seguridad y control de acceso.')
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# 12. CONCLUSIONES
# ══════════════════════════════════════════════════════════════
add_title('12. CONCLUSIONES', level=1)
conclusions = [
    'LexiSing demuestra que la tecnología puede ser un motor de inclusión social. El desarrollo de una plataforma que traduce Lengua de Señas Colombiana en tiempo real mediante visión por computador e inteligencia artificial demuestra que las barreras de comunicación que enfrentan las personas sordas pueden ser mitigadas mediante soluciones tecnológicas accesibles e innovadoras.',
    'La integración de MediaPipe HandLandmarker y Groq API permite un reconocimiento de señas eficiente sin necesidad de infraestructura de servidor pesada. Al ejecutarse el reconocimiento de señas directamente en el navegador (client-side) y utilizar una API de IA en la nube, se logra una arquitectura ligera, escalable y de bajo costo operativo.',
    'La metodología Scrum permitió organizar el desarrollo en sprints funcionales, facilitando la integración continua y la retroalimentación oportuna. Cada sprint entregó funcionalidades verificables, desde la autenticación básica hasta el reconocimiento completo de señas.',
    'El sistema de roles y permisos con reglas de seguridad en Firestore garantiza la protección de datos y el acceso adecuado a la información. La implementación de RBAC con 5 roles diferentes asegura que cada usuario acceda únicamente a las funcionalidades correspondientes a su rol.',
    'Aunque el proyecto logra sus objetivos principales, existen áreas de mejora identificadas que pueden ser abordadas en futuras versiones: ampliación del vocabulario de señas, implementación de pruebas automatizadas, despliegue en producción y aplicación móvil nativa.',
]
for i, c in enumerate(conclusions, 1):
    add_para(f'{i}. {c}')
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# 13. RECOMENDACIONES
# ══════════════════════════════════════════════════════════════
add_title('13. RECOMENDACIONES', level=1)
recommendations = [
    'Ampliar el vocabulario de señas reconocidas. El sistema actual reconoce 33 señas y 27 letras. Se recomienda incorporar un modelo de machine learning entrenado con datos de señas colombianas para reconocer un vocabulario más amplio.',
    'Implementar pruebas automatizadas. Se recomienda implementar pruebas con Jasmine/Karma para Angular y Pytest para Django, alcanzando una cobertura mínima del 80% para garantizar la calidad del código.',
    'Desplegar el sistema en un entorno de producción. Se recomienda configurar el despliegue en Firebase Hosting (frontend) y Google Cloud Run (backend), con dominio propio y certificado SSL.',
    'Implementar una aplicación móvil nativa. Una app móvil (Android/iOS) permitiría un acceso más cómodo para los usuarios sordos, aprovechando la cámara del dispositivo y ofreciendo notificaciones push.',
    'Documentar la API con Swagger/OpenAPI. Se recomienda integrar drf-spectacular para generar documentación interactiva de la API del backend.',
]
for i, r in enumerate(recommendations, 1):
    add_para(f'{i}. {r}')
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# 14. REFERENCIAS
# ══════════════════════════════════════════════════════════════
add_title('14. REFERENCIAS', level=1)
refs = [
    'Google. (s.f.). MediaPipe Hand Landmarker. Google AI Edge. https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker',
    'Google. (s.f.). Firebase Authentication. Firebase. https://firebase.google.com/docs/auth',
    'Google. (s.f.). Cloud Firestore. Firebase. https://firebase.google.com/docs/firestore',
    'Groq. (s.f.). Groq API Documentation. https://console.groq.com/docs/api-reference',
    'Angular. (s.f.). Angular Documentation. https://angular.dev/docs',
    'Django Software Foundation. (s.f.). Django Documentation. https://docs.djangoproject.com/',
    'Django REST Framework. (s.f.). Django REST Framework Documentation. https://www.django-rest-framework.org/',
    'Congreso de la República de Colombia. (2012). Ley 1581 de 2012: Por la cual se dictan disposiciones generales para la protección de datos personales. Diario Oficial.',
    'Congreso de la República de Colombia. (2009). Ley 1346 de 2009: Por la cual se adopta la Convención sobre los Derechos de las Personas con Discapacidad. Diario Oficial.',
    'Congreso de la República de Colombia. (2013). Ley Estatutaria 1618 de 2013: Establece disposiciones para garantizar el ejercicio pleno de los derechos de las personas con discapacidad. Diario Oficial.',
    'Departamento Administrativo Nacional de Estadística — DANE. (s.f.). Censo Nacional de Población y Vivienda. https://www.dane.gov.co/',
    'Scrum Alliance. (s.f.). What is Scrum? https://www.scrumalliance.org/why-scrum',
    'Mozilla Developer Network. (s.f.). WebRTC: Real-Time Communication Between Browsers. https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API',
    'TensorFlow. (s.f.). MediaPipe Solutions Guide. https://developers.google.com/mediapipe',
]
for r in refs:
    p = doc.add_paragraph(r)
    p.paragraph_format.space_after = Pt(6)
doc.add_page_break()

# ══════════════════════════════════════════════════════════════
# 15. ANEXOS
# ══════════════════════════════════════════════════════════════
add_title('15. ANEXOS', level=1)

anexos = [
    ('Anexo A', 'Estructura de directorios del proyecto', '(Incluir el árbol de directorios completo del proyecto)'),
    ('Anexo B', 'Configuración de Firebase', '(Incluir configuración de Firebase Console, reglas de Firestore desplegadas)'),
    ('Anexo C', 'Configuración de variables de entorno', '(Incluir ejemplo de .env.example y environment.ts sin datos sensibles)'),
    ('Anexo D', 'Código fuente del servicio de reconocimiento de señas', '(Incluir extracto del código de sign-language.service.ts)'),
    ('Anexo E', 'Código fuente del servicio de formalización de IA', '(Incluir el código de text/services.py con el GroqService)'),
    ('Anexo F', 'Reglas de seguridad Firestore', '(Incluir el archivo firestore.rules completo)'),
    ('Anexo G', 'Configuración de CI/CD', '(Incluir el archivo .github/workflows/ci.yml completo)'),
    ('Anexo H', 'Capturas de pantalla de la aplicación', '(Incluir capturas de las principales vistas)'),
    ('Anexo I', 'Resumen de errores corregidos', '(Incluir el contenido del archivo RESUMEN-ERRORES.md)'),
    ('Anexo J', 'Documento de propuesta técnica y económica', '(Incluir la propuesta técnica original)'),
    ('Anexo K', 'Bitácora de sprints', '(Incluir tabla resumen de cada sprint)'),
]

for code, title, desc in anexos:
    p = doc.add_paragraph()
    run_t = p.add_run(f'{code}: {title}')
    run_t.bold = True
    add_placeholder(desc)
    doc.add_paragraph()

# ── Guardar ──────────────────────────────────────────────────
output_path = '/home/samuel/Proyectos/LexiSing/Informe_Final_ADSO_LexiSing.docx'
doc.save(output_path)
print(f'Documento guardado en: {output_path}')
