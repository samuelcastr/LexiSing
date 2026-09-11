# Índice de Evidencias Automatizadas (Selenium)

| # | Evidencia |
|---|---|
| 1 | 01-form-login-lleno.png |
| 2 | 02-00-login-lleno.png |
| 3 | 03-00-login-validacion.png |
| 4 | 04-form-registro-lleno.png |
| 5 | 05-00-registro-lleno.png |
| 6 | 06-00-registro-validacion.png |
| 7 | 07-00-recuperar-clave.png |
| 8 | 08-rol-supervisor-supervisor-dashboard.png |
| 9 | 09-rol-supervisor-supervisor-usuarios.png |
| 10 | 10-rol-supervisor-supervisor-monitoreo-conversaciones.png |
| 11 | 11-rol-supervisor-supervisor-reportes.png |
| 12 | 12-rol-supervisor-supervisor-configuracion.png |
| 13 | 13-rol-empleado-empleados-dashboard.png |
| 14 | 14-rol-empleado--conversations.png |
| 15 | 15-rol-empleado-empleados-configuracion.png |
| 16 | 16-rol-admin-admin-dashboard.png |
| 17 | 17-rol-admin-admin-usuarios.png |
| 18 | 18-rol-admin-admin-solicitudes.png |
| 19 | 19-rol-admin-admin-reportes.png |
| 20 | 20-rol-admin-admin-configuracion.png |
| 21 | 21-rol-usuario-usuario.png |
| 22 | 22-rol-sordomudo-sordomudo-dashboard.png |
| 23 | 23-rol-sordomudo--conversations.png |
| 24 | 24-rol-sordomudo-sordomudo-configuracion.png |
| 25 | 25-99-seguridad-redireccion-usuario.png |
| 26 | 26-99-chat-directo.png |
| 27 | 27-btn-registro-pestana.png |
| 28 | 28-btn-olvidar-contrasena.png |
| 29 | 29-btn-login-google.png |
| 30 | 30-btn-registro-ojos-contrasena.png |
| 31 | 31-menu-supervisor-dashboard.png |
| 32 | 32-menu-supervisor-chat.png |
| 33 | 33-menu-supervisor-usuarios.png |
| 34 | 34-menu-supervisor-monitoreo.png |
| 35 | 35-menu-supervisor-reportes.png |
| 36 | 36-menu-supervisor-configuracion.png |
| 37 | 37-menu-empleado-dashboard.png |
| 38 | 38-menu-empleado-chat.png |
| 39 | 39-menu-empleado-configuracion.png |
| 40 | 40-menu-admin-dashboard.png |
| 41 | 41-menu-admin-usuarios.png |
| 42 | 42-menu-admin-solicitudes.png |
| 43 | 43-menu-admin-chat.png |
| 44 | 44-menu-admin-reportes.png |
| 45 | 45-menu-admin-configuracion.png |
| 46 | 46-menu-sordomudo-dashboard.png |
| 47 | 47-menu-sordomudo-chat.png |
| 48 | 48-menu-sordomudo-configuracion.png |
| 49 | 49-btn-nueva-conversacion-modal.png |
| 50 | 50-btn-enviar-mensaje.png |
| 51 | 51-tab-reportes-1-Estado-de-Usuarios.png |
| 52 | 52-tab-reportes-2-Conversaciones.png |
| 53 | 53-tab-reportes-3-Actividad-3D.png |
| 54 | 54-tab-reportes-4-Mensajes-por-Hora.png |
| 55 | 55-select-monitoreo-fecha.png |
| 56 | 56-btn-guardar-perfil.png |
| 57 | 57-btn-cancelar-perfil.png |
| 58 | 58-btn-sidebar-colapsada.png |
| 59 | 59-btn-logout.png |
| 60 | 60-usuario-sala-de-espera-vista.png |
| 61 | 61-btn-login-microsoft.png |
| 62 | 62-form-login-social-botones.png |
| - | foto-perfil-test.png |

## Resumen por caso (verificación de errores)

| Rol/Caso | Página | Resultado |
|---|---|---|
| publico        | /login (lleno)                             | SIN ERRORES |
| publico        | /login (validacion vacio)                  | VALIDACION ACTIVA |
| publico        | /register (lleno)                          | SIN ERRORES |
| publico        | /register (validacion)                     | VALIDACION ACTIVA |
| publico        | /forgot-password                           | SIN ERRORES |
| supervisor     | /roles/supervisor/dashboard                | SIN ERRORES |
| supervisor     | /roles/supervisor/usuarios                 | SIN ERRORES |
| supervisor     | /roles/supervisor/monitoreo-conversaciones | SIN ERRORES |
| supervisor     | /roles/supervisor/reportes                 | SIN ERRORES |
| supervisor     | /roles/supervisor/configuracion            | SIN ERRORES |
| empleado       | /roles/empleados/dashboard                 | SIN ERRORES |
| empleado       | /conversations                             | SIN ERRORES |
| empleado       | /roles/empleados/configuracion             | SIN ERRORES |
| admin          | /roles/admin/dashboard                     | SIN ERRORES |
| admin          | /roles/admin/usuarios                      | SIN ERRORES |
| admin          | /roles/admin/solicitudes                   | SIN ERRORES |
| admin          | /roles/admin/reportes                      | SIN ERRORES |
| admin          | /roles/admin/configuracion                 | SIN ERRORES |
| usuario        | /roles/usuario                             | SIN ERRORES |
| sordomudo      | /roles/sordomudo/dashboard                 | SIN ERRORES |
| sordomudo      | /conversations                             | SIN ERRORES |
| sordomudo      | /roles/sordomudo/configuracion             | SIN ERRORES |
| seguridad      | usuario->admin/usuarios                    | REDIRIGIDO A SU ROL (OK) |
| sordomudo      | /chat/:id                                  | SIN ERRORES |
| botones        | /login (tabs/social)                       | TABS+FLUJO GOOGLE OK |
| botones        | /register (ojos)                           | OJOS MOSTRAR/OCULTAR PROBADOS |
| menu/supervisor | dashboard                                  | SIN ERRORES |
| menu/supervisor | chat                                       | SIN ERRORES |
| menu/supervisor | usuarios                                   | SIN ERRORES |
| menu/supervisor | monitoreo                                  | SIN ERRORES |
| menu/supervisor | reportes                                   | SIN ERRORES |
| menu/supervisor | configuracion                              | SIN ERRORES |
| menu/empleado  | dashboard                                  | SIN ERRORES |
| menu/empleado  | chat                                       | SIN ERRORES |
| menu/empleado  | configuracion                              | SIN ERRORES |
| menu/admin     | dashboard                                  | SIN ERRORES |
| menu/admin     | usuarios                                   | SIN ERRORES |
| menu/admin     | solicitudes                                | SIN ERRORES |
| menu/admin     | chat                                       | SIN ERRORES |
| menu/admin     | reportes                                   | SIN ERRORES |
| menu/admin     | configuracion                              | SIN ERRORES |
| menu/sordomudo | dashboard                                  | SIN ERRORES |
| menu/sordomudo | chat                                       | SIN ERRORES |
| menu/sordomudo | configuracion                              | SIN ERRORES |
| botones        | nueva-conversacion                         | MODAL ABRE/CIERRA OK |
| botones        | enviar-mensaje                             | enviado sin indicadores |
| botones        | reportes (tabs)                            | TABS 4 NAVEGADAS |
| botones        | monitoreo(select fecha)                    | SELECT INTERACTIVO OK |
| botones        | guardar perfil                             | guardado/sin indicadores |
| botones        | cancelar perfil                            | CANCELAR PROBADO |
| botones        | sidebar (menu-toggle)                      | COLLAPSE/RESTAURAR OK |
| botones        | logout                                     | CERRÓ SESIÓN → /login OK |
| usuario        | sala de espera                             | SIN NAVEGACION (ESPERADO, OK) |
| publico        | /login (microsoft)                         | FLUJO MICROSOFT OK |
| publico        | /login (social)                            | BOTONES SOCIAL (GOOGLE + MICROSOFT) VISIBLES |
