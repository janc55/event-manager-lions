# Plan de Implementación Pendiente

**Proyecto:** 75 Convención Nacional del Club de Leones Bolivia  
**Base actual:** backend NestJS inicial ya creado  
**Objetivo de este documento:** detallar todas las tareas faltantes para que otro agente IA pueda construir el sistema completo siguiendo [SPECS.md](d:/DESARROLLO/NEST/EventManager/SPECS.md)

---

## 1. Estado actual

Actualmente existe una base backend con:

- NestJS configurado.
- Auth JWT básico.
- Módulos iniciales: `auth`, `users`, `participants`, `payments`, `activities`, `operations`, `reports`, `audit`.
- Generación básica de credencial PDF.
- Endpoints base del MVP.
- Estructura TypeORM.
- Migración inicial.
- Seed inicial de admin.

### Limitaciones actuales del código

- No existe frontend.
- No existe flujo real de login visual.
- No existe UI de escaneo QR.
- No existe exportación real a Excel o CSV.
- No existe manejo formal de archivos más allá de upload local simple.
- No existe auditoría automática integrada en todos los módulos.
- No existen tests.
- No existe bootstrap de datos de demo.
- No existe manejo refinado de errores, filtros, logs o métricas.
- No existe sistema de estados de negocio suficientemente robusto.
- No existe diseño visual, layout administrativo ni experiencia de usuario.

---

## 2. Convenciones para el agente que implemente

### Reglas de producto

- No convertir esto en SaaS.
- No introducir multi-tenant.
- No introducir Redis, colas, IA, microservicios ni modo offline.
- Mantener un diseño modular pero simple.
- Priorizar operaciones reales del evento por encima de abstracciones genéricas.

### Reglas técnicas

- Mantener NestJS + PostgreSQL para backend.
- Construir frontend en Next.js con TypeScript.
- Usar validaciones estrictas en DTOs.
- No usar `synchronize: true` en producción.
- Toda acción crítica debe ser trazable.
- Todo flujo importante debe tener criterio de aceptación verificable.

### Reglas de UX

- El sistema debe poder ser usado por personal de mesa sin entrenamiento técnico.
- Las pantallas críticas deben requerir pocos clics.
- El escaneo QR debe priorizar velocidad y legibilidad.
- El estado financiero del participante debe verse claramente en pantalla.

---

## 3. Orden recomendado de implementación

### Fase 1: cerrar backend funcional

1. Corregir y endurecer dominio de backend.
2. Completar flujos de negocio faltantes.
3. Agregar exportaciones y auditoría.
4. Añadir tests mínimos.

### Fase 2: construir frontend operativo

1. Login.
2. Dashboard.
3. CRUD de participantes.
4. Pagos.
5. Actividades.
6. Escaneo QR.
7. Reportes.

### Fase 3: hardening para producción

1. Validación completa.
2. manejo de errores.
3. logs.
4. seeds de demo.
5. checklist de despliegue.

---

## 4. Tareas de backend

## 4.1 Configuración y base técnica

### Tarea BE-001: revisar configuración global

Objetivo:

- asegurar que `ConfigModule`, CORS, Helmet, ValidationPipe y Swagger estén listos para producción inicial.

Subtareas:

- revisar [main.ts](d:/DESARROLLO/NEST/EventManager/src/main.ts)
- revisar [app.module.ts](d:/DESARROLLO/NEST/EventManager/src/app.module.ts)
- confirmar que `UPLOAD_DIR` se use correctamente
- agregar prefijo de API consistente
- agregar versión de API si se considera necesario

Criterio de aceptación:

- la app arranca con `.env`
- Swagger abre correctamente
- los DTOs bloquean propiedades no permitidas

### Tarea BE-002: agregar filtro global de excepciones

Objetivo:

- homogeneizar respuestas de error.

Subtareas:

- crear `src/common/filters/global-exception.filter.ts`
- normalizar respuesta JSON con:
  - `statusCode`
  - `message`
  - `error`
  - `timestamp`
  - `path`
- capturar errores de negocio, validación y DB

Criterio de aceptación:

- todos los errores HTTP tengan formato uniforme

### Tarea BE-003: agregar logging estructurado

Objetivo:

- dejar trazabilidad mínima del backend.

Subtareas:

- integrar logger simple con Nest Logger o Winston
- loguear errores 5xx
- loguear inicio de app y configuración crítica sin secretos
- loguear uploads fallidos

Criterio de aceptación:

- errores y arranque quedan visibles en logs legibles

---

## 4.2 Auth y usuarios

### Tarea BE-010: endurecer autenticación

Objetivo:

- asegurar login usable en producción.

Subtareas:

- revisar `AuthService`
- validar usuarios inactivos
- devolver payload de usuario consistente
- agregar expiración clara del JWT
- documentar formato de `Authorization`

Criterio de aceptación:

- login válido retorna token y datos del usuario
- login inválido retorna 401 uniforme

### Tarea BE-011: completar gestión de usuarios

Objetivo:

- permitir administración completa de usuarios internos.

Subtareas:

- agregar endpoint para desactivar usuario
- agregar endpoint para reset de contraseña
- impedir que un usuario se auto-desactive accidentalmente
- validar duplicidad por email

Criterio de aceptación:

- admin puede crear, editar, activar y desactivar usuarios

### Tarea BE-012: seed adicional de operador

Objetivo:

- facilitar pruebas operativas.

Subtareas:

- crear seed opcional de usuario `operator`
- configurar variables de entorno para este seed

Criterio de aceptación:

- se puede crear un operador de prueba sin tocar la base manualmente

---

## 4.3 Participantes

### Tarea BE-020: refinar modelo de participante

Objetivo:

- alinear la entidad con `SPECS.md`.

Subtareas:

- revisar si faltan campos:
  - city
  - gender
  - emergency_contact
  - badge_name
  - registration_date
- decidir qué campos serán obligatorios y cuáles opcionales
- actualizar entidad, DTOs y migración nueva

Criterio de aceptación:

- el modelo refleja el registro real requerido por organización

### Tarea BE-021: mejorar reglas anti-duplicado

Objetivo:

- evitar registros repetidos.

Subtareas:

- implementar búsqueda previa por:
  - documento
  - email
  - combinación nombre + club + país si no hay documento
- definir si se bloquea o solo se advierte
- devolver mensajes claros al frontend

Criterio de aceptación:

- el sistema detecta duplicados razonables antes de guardar

### Tarea BE-022: filtros y búsqueda avanzada de participantes

Objetivo:

- poder operar desde mesa y administración.

Subtareas:

- agregar query params a `GET /participants`
- soportar filtros por:
  - nombre
  - email
  - documento
  - club
  - distrito
  - país
  - tipo de participante
  - estado
- agregar paginación
- agregar ordenamiento

Criterio de aceptación:

- listado responde rápido y permite encontrar participantes fácilmente

### Tarea BE-023: anulación o baja lógica

Objetivo:

- permitir invalidar registros sin borrarlos.

Subtareas:

- definir si se usa `status = cancelled` o un flag
- impedir borrado físico directo vía API

Criterio de aceptación:

- participantes anulados siguen auditables

### Tarea BE-024: endpoint de detalle operativo

Objetivo:

- devolver en una sola respuesta la información necesaria para acreditación.

Subtareas:

- crear endpoint tipo `GET /participants/:id/summary`
- incluir:
  - datos básicos
  - estado financiero
  - entregas registradas
  - asistencias registradas
  - requerimientos especiales

Criterio de aceptación:

- frontend no necesita múltiples requests para la pantalla de acreditación

### Tarea BE-025: formulario público opcional

Objetivo:

- habilitar pre-registro si da el tiempo.

Subtareas:

- crear endpoint público protegido por rate limit
- separar permisos de staff y público
- marcar registros públicos como `pre_registered`

Criterio de aceptación:

- una persona puede preinscribirse sin autenticación

---

## 4.4 QR y credenciales

### Tarea BE-030: formalizar generación de QR

Objetivo:

- asegurar formato estable.

Subtareas:

- decidir si el QR codifica solo token o URL con token
- definir formato único
- documentar convención
- validar regeneración con auditoría

Criterio de aceptación:

- todos los QR son consistentes y seguros para operación

### Tarea BE-031: mejorar credencial PDF

Objetivo:

- dejar una credencial profesional y lista para impresión.

Subtareas:

- definir layout real
- agregar branding del evento
- mejorar tipografía y jerarquía visual
- permitir:
  - PDF individual
  - lote por filtros
- evaluar incorporación de foto si el alcance lo permite

Criterio de aceptación:

- la credencial puede imprimirse y usarse en el evento real

### Tarea BE-032: generación masiva de credenciales

Objetivo:

- evitar descargar una por una.

Subtareas:

- endpoint para generar lote por:
  - todos
  - pagados
  - por club
  - por distrito
- definir respuesta:
  - zip de PDFs o PDF consolidado

Criterio de aceptación:

- el administrador puede generar credenciales por lote

---

## 4.5 Pagos y estado financiero

### Tarea BE-040: refactor del modelo de pagos

Objetivo:

- soportar mejor pagos parciales y trazabilidad.

Problema actual:

- la entidad actual mezcla estado acumulado con un solo registro.

Decisión recomendada:

- separar en:
  - `payment_accounts` o estado acumulado por participante
  - `payment_transactions` para cada pago realizado

Si no se quiere ampliar mucho:

- mantener `payments`, pero tratar cada fila como una transacción y calcular acumulados en consulta.

Subtareas:

- definir modelo final
- ajustar migraciones
- actualizar servicios

Criterio de aceptación:

- se puede registrar más de un pago por participante sin inconsistencias

### Tarea BE-041: cargar voucher con validación correcta

Objetivo:

- endurecer upload de respaldo.

Subtareas:

- validar MIME
- validar tamaño máximo
- validar extensiones permitidas
- rechazar archivo vacío
- almacenar ruta relativa o estrategia consistente

Criterio de aceptación:

- vouchers inválidos son rechazados

### Tarea BE-042: revisión manual de pagos

Objetivo:

- permitir aprobación operativa correcta.

Subtareas:

- definir estados definitivos:
  - pending
  - partial
  - paid
  - waived
  - rejected si se necesita
- permitir revisión por admin
- registrar `reviewed_by` y `reviewed_at`
- guardar observaciones

Criterio de aceptación:

- un admin puede confirmar o corregir un pago manualmente

### Tarea BE-043: cálculo de estado de cuenta

Objetivo:

- mostrar saldo real del participante.

Subtareas:

- definir costo esperado según tipo de participante
- permitir excepciones:
  - cortesía
  - invitado
  - exento
- devolver:
  - monto total
  - pagado
  - saldo
  - estado

Criterio de aceptación:

- el summary financiero es correcto y consistente

### Tarea BE-044: historial financiero

Objetivo:

- poder auditar pagos y revisiones.

Subtareas:

- endpoint de historial por participante
- incluir transacciones, vouchers y revisiones

Criterio de aceptación:

- el admin puede explicar por qué un participante está pagado o pendiente

---

## 4.6 Actividades

### Tarea BE-050: completar CRUD de actividades

Objetivo:

- dejar módulo totalmente usable.

Subtareas:

- agregar `GET /activities/:id`
- agregar desactivación o cierre
- validar fechas y horas
- impedir edición incoherente si ya está cerrada

Criterio de aceptación:

- las actividades pueden administrarse de forma segura

### Tarea BE-051: control de cupo opcional

Objetivo:

- soportar actividades con capacidad limitada.

Subtareas:

- agregar validación de cupo al registrar asistencia por actividad
- decidir si bloquea o solo advierte

Criterio de aceptación:

- el sistema puede alertar si una actividad excede capacidad

---

## 4.7 Operaciones QR

### Tarea BE-060: refactor del módulo de operaciones

Objetivo:

- garantizar reglas de duplicidad y velocidad.

Subtareas:

- revisar flujo de:
  - asistencia general
  - asistencia por actividad
  - entrega de materiales
  - entrega de refrigerios
- asegurar consultas mínimas
- homogeneizar respuestas de escaneo

Criterio de aceptación:

- escaneo devuelve respuesta rápida y consistente

### Tarea BE-061: resolver unicidad real en base de datos

Objetivo:

- garantizar que no existan duplicados aunque falle la lógica de aplicación.

Subtareas:

- revisar migración inicial
- aplicar índices únicos correctos para:
  - asistencia general
  - asistencia por actividad
  - entrega por tipo

Nota:

- en PostgreSQL, `NULL` en índices únicos requiere cuidado; usar índices parciales si corresponde.

Criterio de aceptación:

- la DB impide duplicados operativos

### Tarea BE-062: endpoint de validación previa por QR

Objetivo:

- permitir lookup sin registrar operación.

Subtareas:

- crear endpoint tipo `POST /operations/scan/preview`
- responder:
  - participante
  - estado financiero
  - entregas hechas
  - asistencias hechas

Criterio de aceptación:

- el operador puede consultar antes de registrar una acción

### Tarea BE-063: soporte para múltiples controles de refrigerio

Objetivo:

- soportar más de una entrega alimentaria si el evento lo requiere.

Subtareas:

- definir si `delivery_type` necesita más granularidad
- posible modelo:
  - `snack_morning`
  - `snack_afternoon`
  - `dinner`
- ajustar servicios y reportes

Criterio de aceptación:

- el sistema puede manejar una o varias entregas por jornada sin ambigüedad

---

## 4.8 Reportes y exportaciones

### Tarea BE-070: cerrar endpoints de reportes

Objetivo:

- producir datos administrativamente útiles.

Subtareas:

- ampliar reportes por:
  - país
  - distrito
  - club
  - tipo de participante
  - estado financiero
  - requerimientos especiales
- agregar resúmenes y totales

Criterio de aceptación:

- los reportes responden preguntas reales de organización

### Tarea BE-071: exportación a CSV

Objetivo:

- habilitar extracción inmediata de datos.

Subtareas:

- implementar export de participantes
- export de pagos
- export de asistencia
- export de entregas
- definir nombres de columnas amigables

Criterio de aceptación:

- admin puede descargar CSV listo para Excel

### Tarea BE-072: exportación a Excel opcional

Objetivo:

- mejorar entregables para cliente.

Subtareas:

- evaluar `exceljs`
- generar hojas separadas por dominio

Criterio de aceptación:

- se puede generar al menos un archivo Excel útil si el tiempo lo permite

---

## 4.9 Auditoría

### Tarea BE-080: integrar auditoría automática

Objetivo:

- registrar acciones críticas sin depender de llamadas manuales.

Subtareas:

- decidir entre interceptor, servicio explícito o eventos de dominio
- registrar:
  - creación/edición de participantes
  - regeneración de QR
  - revisión de pagos
  - escaneos operativos
  - creación/edición de actividades
  - altas y cambios de usuarios

Criterio de aceptación:

- existe rastro claro de toda acción crítica

### Tarea BE-081: reporte de auditoría

Objetivo:

- permitir revisión administrativa.

Subtareas:

- filtros por usuario
- filtros por entidad
- filtros por fecha

Criterio de aceptación:

- admin puede investigar cambios relevantes

---

## 4.10 Seeds y datos de demo

### Tarea BE-090: seed de datos operativos

Objetivo:

- facilitar demo y pruebas.

Subtareas:

- crear seed de:
  - 1 admin
  - 2 operadores
  - 20 participantes de ejemplo
  - 4 actividades
  - pagos variados

Criterio de aceptación:

- la app puede mostrarse al cliente con datos realistas

---

## 4.11 Testing backend

### Tarea BE-100: tests unitarios mínimos

Objetivo:

- cubrir la lógica sensible.

Subtareas:

- tests de `AuthService`
- tests de reglas de estado financiero
- tests de duplicidad de asistencia
- tests de duplicidad de entregas

Criterio de aceptación:

- las reglas críticas tienen pruebas automatizadas

### Tarea BE-101: tests e2e mínimos

Objetivo:

- validar flujos principales.

Subtareas:

- login
- crear participante
- registrar pago
- escanear asistencia general
- impedir segundo escaneo duplicado

Criterio de aceptación:

- los flujos core pasan de extremo a extremo

---

## 5. Tareas de frontend

## 5.1 Setup base

### Tarea FE-001: crear aplicación Next.js

Objetivo:

- iniciar frontend administrativo.

Subtareas:

- crear app con TypeScript y App Router
- integrar Tailwind
- definir estructura de carpetas
- configurar cliente API
- configurar manejo de token JWT

Criterio de aceptación:

- frontend arranca y puede hablar con backend

### Tarea FE-002: definir sistema visual

Objetivo:

- evitar UI improvisada.

Subtareas:

- crear layout admin
- definir paleta
- definir tipografía
- definir estilos de tablas, badges, cards, alerts y formularios
- definir componentes base reutilizables

Criterio de aceptación:

- el sistema se ve profesional y consistente

---

## 5.2 Autenticación frontend

### Tarea FE-010: pantalla de login

Objetivo:

- permitir acceso al sistema.

Subtareas:

- formulario email/password
- manejo de error de autenticación
- guardar token en estrategia consistente
- redirección al dashboard

Criterio de aceptación:

- un usuario puede entrar y navegar autenticado

### Tarea FE-011: guardas de rutas

Objetivo:

- proteger pantallas privadas.

Subtareas:

- middleware o control en cliente/servidor
- ocultar rutas no autorizadas
- manejar expiración de sesión

Criterio de aceptación:

- usuario sin sesión no accede a módulos privados

---

## 5.3 Dashboard

### Tarea FE-020: dashboard principal

Objetivo:

- mostrar estado general del evento.

Subtareas:

- cards con:
  - total participantes
  - pagados
  - pendientes
  - asistencias registradas
  - materiales entregados
  - refrigerios entregados
- accesos rápidos

Criterio de aceptación:

- admin y operador ven el estado general al ingresar

---

## 5.4 Participantes frontend

### Tarea FE-030: listado de participantes

Objetivo:

- pantalla principal de administración de registros.

Subtareas:

- tabla paginada
- filtros
- búsqueda rápida
- columnas mínimas:
  - nombre
  - club
  - distrito
  - país
  - tipo
  - estado
  - saldo

Criterio de aceptación:

- el usuario puede encontrar y abrir participantes sin fricción

### Tarea FE-031: formulario de participante

Objetivo:

- crear y editar registros.

Subtareas:

- formulario completo según spec
- validaciones visuales
- mensajes claros
- modo crear y editar

Criterio de aceptación:

- se pueden registrar participantes correctamente

### Tarea FE-032: detalle del participante

Objetivo:

- tener una vista operativa completa.

Subtareas:

- mostrar:
  - datos personales
  - estado de cuenta
  - QR
  - credencial
  - historial de pagos
  - historial de escaneos
  - requerimientos especiales
- botones:
  - editar
  - regenerar QR
  - descargar credencial

Criterio de aceptación:

- el detalle concentra toda la información importante

---

## 5.5 Pagos frontend

### Tarea FE-040: pantalla de pagos

Objetivo:

- administrar estado financiero de participantes.

Subtareas:

- listado de pagos o cuentas
- filtros por estado
- búsqueda por participante
- indicador visual de saldo

Criterio de aceptación:

- el admin puede encontrar rápidamente quién debe y quién pagó

### Tarea FE-041: registrar pago

Objetivo:

- permitir carga manual y ordenada.

Subtareas:

- formulario de pago
- carga de voucher
- comentarios
- actualización de estado

Criterio de aceptación:

- se puede registrar pago parcial o total

### Tarea FE-042: revisión de pagos

Objetivo:

- permitir al admin aprobar o ajustar pagos.

Subtareas:

- vista con voucher
- observaciones
- acción aprobar, marcar parcial, exonerar o rechazar

Criterio de aceptación:

- la revisión se puede hacer desde una sola pantalla

---

## 5.6 Actividades frontend

### Tarea FE-050: listado y CRUD de actividades

Objetivo:

- administrar agenda interna.

Subtareas:

- tabla de actividades
- formulario de alta y edición
- filtros por estado y fecha

Criterio de aceptación:

- admin puede crear y mantener actividades sin ayuda técnica

---

## 5.7 Operaciones QR frontend

### Tarea FE-060: pantalla de acreditación general

Objetivo:

- permitir operar mesa de registro.

Subtareas:

- input de escaneo con autofocus permanente
- soporte para lector tipo teclado
- soporte opcional de cámara web
- mostrar respuesta grande y clara
- mostrar:
  - nombre
  - club
  - estado financiero
  - requerimientos especiales
  - alertas
- botón o acción para registrar asistencia general

Criterio de aceptación:

- un operador puede acreditar personas rápidamente con lector QR

### Tarea FE-061: pantalla de control por actividad

Objetivo:

- registrar ingreso a actividades.

Subtareas:

- selector de actividad
- input de escaneo
- confirmación visible
- advertencia por duplicado

Criterio de aceptación:

- operador selecciona actividad y escanea en flujo continuo

### Tarea FE-062: pantalla de entrega de materiales

Objetivo:

- controlar entrega operativa.

Subtareas:

- input de escaneo
- respuesta inmediata
- bloqueo si ya fue entregado

Criterio de aceptación:

- no se duplican entregas de material

### Tarea FE-063: pantalla de control de refrigerios

Objetivo:

- registrar consumos según reglas del evento.

Subtareas:

- input de escaneo
- si hay varios tipos de refrigerio, selector visible
- alertas de duplicado

Criterio de aceptación:

- operación rápida y sin ambigüedad

### Tarea FE-064: modo lookup manual

Objetivo:

- soportar casos donde falle el QR.

Subtareas:

- buscar por nombre, documento o código
- abrir ficha operativa
- ejecutar acción equivalente al escaneo

Criterio de aceptación:

- el operador puede continuar aun sin leer el QR

---

## 5.8 Reportes frontend

### Tarea FE-070: módulo de reportes

Objetivo:

- dar salida administrativa al sistema.

Subtareas:

- pestañas o secciones para:
  - participantes
  - pagos
  - asistencia
  - entregas
  - actividades
- filtros por fecha, estado y clasificación
- botones de exportación

Criterio de aceptación:

- admin puede consultar y exportar reportes sin tocar la base

---

## 5.9 UX y componentes transversales

### Tarea FE-080: componentes reutilizables

Objetivo:

- evitar duplicación de UI.

Subtareas:

- crear:
  - data table
  - form field
  - status badge
  - money badge
  - modal de confirmación
  - uploader de voucher
  - visor de QR
  - toast de notificación

Criterio de aceptación:

- la UI se arma con piezas consistentes

### Tarea FE-081: estados vacíos, loading y error

Objetivo:

- que la app se sienta terminada.

Subtareas:

- skeletons o loaders
- empty states útiles
- mensajes de error recuperables

Criterio de aceptación:

- no hay pantallas “rotas” o sin feedback

---

## 5.10 Testing frontend

### Tarea FE-090: tests críticos de UI

Objetivo:

- cubrir lo más sensible.

Subtareas:

- login
- formulario de participante
- pantalla de escaneo
- flujo de carga de voucher

Criterio de aceptación:

- al menos los flujos más sensibles tienen cobertura básica

---

## 6. Integración frontend-backend

### Tarea IN-001: definir cliente API

Objetivo:

- centralizar llamadas al backend.

Subtareas:

- wrapper fetch o axios
- manejo de token
- manejo de errores
- tipos compartidos o adaptadores

### Tarea IN-002: mapear contratos reales

Objetivo:

- evitar desacoples.

Subtareas:

- revisar respuesta real de cada endpoint
- adaptar frontend a payloads existentes o ajustar backend
- documentar contratos críticos:
  - login
  - participants list
  - participant summary
  - payment status
  - scan response

### Tarea IN-003: decidir estrategia de archivos

Objetivo:

- asegurar acceso a vouchers y PDFs.

Subtareas:

- definir si Nest servirá archivos estáticos
- exponer rutas seguras para vouchers si aplica
- permitir descarga de credenciales

---

## 7. Tareas de datos y dominio

### Tarea DM-001: definir tarifas de inscripción

Objetivo:

- cerrar lógica financiera.

Subtareas:

- definir catálogo de tipos de participante
- asignar costo esperado por tipo
- decidir si va hardcoded o en tabla configurable

### Tarea DM-002: definir catálogo de tipos de entrega

Objetivo:

- evitar strings ambiguos.

Subtareas:

- definir enumeraciones reales del evento
- decidir si materiales y refrigerios serán configurables

### Tarea DM-003: definir estados finales del participante

Objetivo:

- evitar estados confusos.

Subtareas:

- decidir set final:
  - pre_registered
  - confirmed
  - checked_in
  - cancelled
- definir transiciones permitidas

---

## 8. Hardening de producción

### Tarea PR-001: variables de entorno finales

Objetivo:

- dejar despliegue controlado.

Subtareas:

- documentar `.env.production`
- validar todos los secretos requeridos

### Tarea PR-002: servir uploads y PDFs de forma segura

Objetivo:

- evitar pérdida o exposición incorrecta de archivos.

Subtareas:

- definir volumen o carpeta persistente
- definir backups
- proteger archivos sensibles si se requiere

### Tarea PR-003: checklist de despliegue

Objetivo:

- facilitar salida a producción.

Subtareas:

- crear documento con:
  - instalación
  - `.env`
  - migraciones
  - seed admin
  - build
  - arranque PM2
  - backup

### Tarea PR-004: smoke test post-deploy

Objetivo:

- validar sistema tras despliegue.

Subtareas:

- login
- crear participante
- registrar pago
- generar credencial
- escanear asistencia

---

## 9. Entregables finales esperados

El sistema debe terminar con estos entregables:

- backend NestJS funcional
- frontend Next.js funcional
- login y roles
- CRUD de participantes
- control de pagos
- QR y credencial
- operaciones de asistencia y entregas
- gestión de actividades
- reportes y exportación
- migraciones
- seed admin
- seed demo opcional
- documentación de despliegue

---

## 10. Checklist mínimo para considerar el sistema terminado

- se puede iniciar sesión como admin y operador
- se puede registrar un participante
- se puede registrar un pago parcial o total
- se puede adjuntar voucher
- se puede generar QR
- se puede descargar credencial PDF
- se puede escanear asistencia general
- se puede escanear asistencia por actividad
- se puede registrar entrega de materiales
- se puede registrar refrigerio
- el sistema evita duplicados operativos
- se pueden ver reportes básicos
- se puede exportar CSV
- existe auditoría de acciones críticas

---

## 11. Recomendación de ejecución para otro agente IA

Orden recomendado de trabajo:

1. Cerrar backend de dominio y contratos.
2. Implementar exportaciones y summary operativo.
3. Crear frontend base con auth y layout.
4. Construir participantes y pagos.
5. Construir pantallas de escaneo.
6. Construir reportes.
7. Agregar tests y hardening.

Si el tiempo es limitado, las prioridades absolutas son:

- login
- participantes
- pagos
- QR
- credencial
- escaneo general
- escaneo por actividad
- materiales
- reportes básicos
