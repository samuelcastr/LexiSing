# Propuesta Técnica y Económica — LexiSing

**Justificación de su inclusión:** la propuesta técnica y económica es un entregable propio del programa Tecnólogo en Análisis y Desarrollo de Software (ADSO-SENA), ya que acompaña al proyecto desde la fase de planeación (Puntos 4 y 10 del informe).

## Resumen de la propuesta técnica

- **Proyecto:** LexiSing — Plataforma web para la comunicación de personas sordomudas mediante el reconocimiento de la Lengua de Señas Colombiana (LSC) con IA y formalización de texto.
- **Alcance:** autenticación multi-proveedor (correo, Google, Microsoft); 5 roles (admin, supervisor, empleado, sordomudo, usuario); chat en tiempo real; reconocimiento de señas con MediaPipe (modos palabras y deletreo); formalización de texto con Groq API; monitoreo y reportes del supervisor; sala de espera y solicitudes de rol.
- **Arquitectura:** frontend Angular 20 (SCSS, Angular Material, RxJS, MediaPipe Tasks Vision); backend Django 6 / Django REST Framework; Firebase (Authentication, Firestore, Hosting); IA Groq (modelo `qwen/qwen3.8-27b`); CI/CD con GitHub Actions.
- **Equipo:** 4 desarrolladores (Scrum) — PO/Tech Lead, Frontend, Backend/DevOps, QA.

## Resumen de la propuesta económica (detalle en el punto 10 y Tabla 18/19)

| Concepto | Valor estimado |
|---|---|
| Desarrollo del proyecto (equipo, 4 roles × 4 sprints) | (Costo real del equipo) |
| Firebase (Auth + Firestore + Hosting) | Gratis (plan Spark) |
| Groq API | Gratis (plan gratuito con límites) |
| GitHub Actions | Gratis (repos públicos) |
| **Total** | **$0 USD durante desarrollo/pruebas** |