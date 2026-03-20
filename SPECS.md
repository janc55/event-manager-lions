# Sistema de Gestión de Convención

**Especificación Funcional y Técnica**

**Proyecto:** 75 Convención Nacional del Club de Leones Bolivia  
**Versión:** 1.0  
**Enfoque:** MVP funcional para producción  
**Stack base:** NestJS + PostgreSQL + frontend web administrativo

---

## 1. Objetivo del sistema

Desarrollar un sistema web para operar la **75 Convención Nacional del Club de Leones Bolivia**, con foco en:

- Registro de participantes.
- Validación de pagos y estado de cuenta.
- Generación de QR individual por participante.
- Control operativo mediante escaneo de QR.
- Gestión de actividades internas del evento.
- Reportes administrativos y operativos.
- Emisión de credencial lista para impresión.

Este sistema **no será un SaaS** en esta etapa. Será una solución específica para un evento, diseñada para salir a producción rápido, con una base técnica ordenada que luego permita evolucionar.

---

## 2. Revisión crítica de la especificación anterior

La versión anterior tenía buenas intenciones técnicas, pero no era adecuada para el objetivo actual por estas razones:

- Introducía complejidad de SaaS y multi-tenant sin necesidad real para un solo cliente y un solo evento.
- Incluía IA para vouchers, Redis, Bull, storage externo y otros componentes que aumentan tiempo, costo y riesgo operativo.
- Mezclaba MVP con fases futuras, dificultando defender un alcance claro frente al cliente.
- Agregaba módulos secundarios como feedback post-evento que no son prioritarios para la operación real de la convención.
- Sobrediseñaba la arquitectura para un problema que hoy requiere velocidad, confiabilidad y facilidad de uso.

Decisión de producto:

- Se elimina el enfoque SaaS.
- Se elimina multi-tenant.
- Se elimina IA para validación de vouchers.
- Se elimina infraestructura no indispensable.
- Se prioriza operación presencial, control con QR, pagos y reportes.

---

## 3. Alcance del MVP

### Incluido

1. Administración de usuarios internos.
2. Configuración general del evento principal.
3. Registro y edición de participantes.
4. Carga manual de voucher de pago.
5. Control de estado financiero del participante.
6. Generación de QR único por participante.
7. Generación de credencial imprimible.
8. Escaneo QR para:
   - asistencia general
   - asistencia por actividad
   - entrega de materiales
   - control de refrigerios
9. Gestión de actividades internas de la convención.
10. Reportes y exportación.
11. Auditoría básica de acciones críticas.

### No incluido en esta versión

- Multi-tenant.
- App móvil nativa.
- Modo offline.
- Validación automática con IA.
- Pasarela de pagos en línea.
- Encuestas o feedback post-evento.
- Arquitectura de microservicios.

---

## 4. Usuarios del sistema

### Administrador

Responsable de configuración general, usuarios, participantes, pagos, actividades y reportes.

### Operador / Staff

Responsable del registro en mesa, verificación de participante, escaneo QR, control de entregas, refrigerios y asistencia.

### Participante

Interactúa de forma limitada mediante formulario de inscripción y eventual consulta de su registro si se habilita.

---

## 5. Funcionalidades principales

### 5.1 Registro de participantes

El sistema debe permitir registrar participantes con al menos los siguientes datos:

- nombres
- apellidos
- documento de identidad o pasaporte
- país
- distrito
- club
- cargo o rol
- correo electrónico
- celular
- tipo de participante
- requerimientos especiales
- observaciones
- voucher adjunto

Campos recomendados adicionales:

- código de participante
- fecha de registro
- ciudad
- género
- nombre para credencial
- contacto de emergencia

Reglas:

- Debe evitar duplicados por combinación de nombre, documento y correo cuando corresponda.
- Debe permitir crear, editar, anular y buscar registros.
- Debe permitir registro manual por staff y también un formulario público si el tiempo de desarrollo lo permite.

### 5.2 Estado financiero y pagos

Cada participante debe tener un estado de cuenta visible.

Datos mínimos:

- tipo de inscripción
- monto total
- monto pagado
- saldo pendiente
- estado: pendiente, parcial, pagado, liberado
- voucher cargado
- observaciones de validación

Reglas:

- El voucher se registra como respaldo, pero la aprobación es manual por un administrador.
- El sistema debe permitir registrar pagos parciales.
- Debe poder marcar excepciones manuales, por ejemplo invitado, exento o cortesía.

### 5.3 QR por participante

Cada participante debe tener un QR único asociado a su registro.

El QR se usará para:

- validación de identidad en mesa
- asistencia general
- asistencia a actividades
- entrega de materiales
- entrega de refrigerios

Reglas:

- El QR debe ser único.
- El QR no debe depender de datos sensibles visibles.
- El sistema debe regenerarlo solo por acción administrativa controlada.

### 5.4 Credencial imprimible

El sistema debe generar una credencial por participante con formato de impresión.

Contenido mínimo:

- nombre completo o nombre para credencial
- club
- distrito
- país
- cargo o rol
- tipo de participante
- QR

Opcional:

- foto
- número de participante
- nombre del evento
- fechas

Formato sugerido:

- tamaño credencial vertical
- exportación a PDF individual
- opción de impresión por lote

### 5.5 Control operativo con escaneo

El sistema debe contar con una pantalla de escaneo rápido para operadores.

Operaciones:

- registrar asistencia general al evento
- registrar asistencia a una actividad específica
- registrar entrega de material
- registrar entrega de refrigerio

Respuesta esperada al escanear:

- participante encontrado
- nombre y datos básicos
- estado financiero
- alerta si tiene saldo pendiente
- confirmación de operación
- bloqueo o advertencia si la operación ya fue registrada

### 5.6 Gestión de actividades

Además del evento principal, se deben crear actividades internas como sesiones, plenarias, cenas o reuniones.

Cada actividad debe permitir:

- nombre
- descripción
- fecha
- hora
- lugar
- cupo opcional
- tipo de actividad
- estado

El QR del participante permitirá registrar su ingreso a cada actividad.

### 5.7 Reportes

El sistema debe generar reportes útiles para operación y administración.

Reportes mínimos:

- participantes inscritos
- participantes pagados, parciales y pendientes
- participantes por país, distrito, club y tipo
- asistencia general
- asistencia por actividad
- entrega de materiales
- entrega de refrigerios
- participantes con requerimientos especiales
- exportación a Excel o CSV

---

## 6. Flujo operativo resumido

### Flujo 1: inscripción

1. Se registra al participante.
2. Se asigna tipo de inscripción y monto.
3. Se adjunta voucher si existe.
4. Se revisa el pago.
5. Se genera QR.
6. Se genera credencial.

### Flujo 2: acreditación en mesa

1. El operador busca al participante o escanea su QR.
2. El sistema muestra su estado.
3. Si corresponde, se confirma asistencia general.
4. Se entrega material.
5. Se marca refrigerio cuando aplique.

### Flujo 3: ingreso a actividades

1. El operador selecciona una actividad.
2. Escanea el QR del participante.
3. El sistema registra la asistencia y evita duplicados.

---

## 7. Reglas de negocio

- Un participante pertenece a un solo registro dentro de la convención.
- Un participante puede tener múltiples movimientos operativos: asistencias, entregas y consumos.
- Una asistencia general no debe duplicarse.
- Una entrega de material no debe duplicarse por tipo.
- Un refrigerio no debe duplicarse por franja o por control definido.
- El estado financiero debe actualizarse con cada registro de pago.
- Los operadores no deben poder aprobar pagos.
- Las acciones críticas deben quedar auditadas.

---

## 8. Modelo funcional de datos

### `users`

- id
- full_name
- email
- password_hash
- role
- is_active
- created_at
- updated_at

### `participants`

- id
- registration_code
- first_name
- last_name
- badge_name
- document_number
- country
- district
- club
- role_title
- email
- phone
- participant_type
- special_requirements
- notes
- qr_code
- status
- created_at
- updated_at

### `payments`

- id
- participant_id
- concept
- expected_amount
- paid_amount
- balance
- status
- voucher_file
- reviewed_by
- reviewed_at
- notes
- created_at
- updated_at

### `activities`

- id
- name
- description
- date
- start_time
- end_time
- location
- capacity
- activity_type
- status
- created_at
- updated_at

### `attendance_records`

- id
- participant_id
- activity_id nullable
- attendance_type
- scanned_by
- scanned_at

Tipos sugeridos:

- general
- activity

### `delivery_records`

- id
- participant_id
- delivery_type
- scanned_by
- delivered_at
- notes

Tipos sugeridos:

- materials
- snack
- kit

### `audit_logs`

- id
- user_id
- action
- entity
- entity_id
- metadata
- created_at

---

## 9. Módulos del sistema en NestJS

La propuesta debe mantenerse simple y modular.

### Módulos recomendados

- `auth`
- `users`
- `participants`
- `payments`
- `activities`
- `operations`
- `reports`
- `audit`
- `files`

### Responsabilidad por módulo

`auth`

- login
- perfil actual
- guards y roles

`users`

- administración de usuarios internos

`participants`

- CRUD de participantes
- generación de QR
- generación de credencial
- búsqueda y filtros

`payments`

- registro de pagos
- carga de voucher
- aprobación manual
- estado de cuenta

`activities`

- CRUD de actividades

`operations`

- escaneo QR
- asistencia general
- asistencia por actividad
- entrega de materiales
- control de refrigerios

`reports`

- resúmenes
- exportaciones

`audit`

- trazabilidad de acciones críticas

`files`

- carga y recuperación de vouchers y recursos de credenciales

---

## 10. Endpoints base sugeridos

### Autenticación

- `POST /auth/login`
- `GET /auth/me`

### Usuarios

- `GET /users`
- `POST /users`
- `PATCH /users/:id`

### Participantes

- `GET /participants`
- `POST /participants`
- `GET /participants/:id`
- `PATCH /participants/:id`
- `GET /participants/:id/badge`
- `POST /participants/:id/regenerate-qr`

### Pagos

- `POST /payments`
- `POST /payments/:id/voucher`
- `PATCH /payments/:id/review`
- `GET /payments/:participantId/account-status`

### Actividades

- `GET /activities`
- `POST /activities`
- `PATCH /activities/:id`

### Operaciones QR

- `POST /operations/scan/general-attendance`
- `POST /operations/scan/activity-attendance`
- `POST /operations/scan/material-delivery`
- `POST /operations/scan/snack-delivery`

### Reportes

- `GET /reports/participants`
- `GET /reports/payments`
- `GET /reports/attendance`
- `GET /reports/activities/:id/attendance`
- `GET /reports/deliveries`

---

## 11. Stack tecnológico recomendado

Se prioriza un stack que puedas construir rápido, mantener y defender frente al cliente.

### Backend

- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- `class-validator`
- `class-transformer`
- JWT
- `bcrypt`
- Swagger
- `multer` para upload de archivos
- `qrcode` para generación de QR
- `pdf-lib` o `pdfmake` para credenciales y PDFs simples

### Frontend

Recomendación principal:

- Next.js
- TypeScript
- Tailwind CSS
- una librería de componentes simple, por ejemplo ShadCN UI

Si necesitas reducir riesgo y tiempo todavía más:

- un panel web server-rendered con NestJS + plantillas también es viable, pero Next.js te dará mejor presentación para la demo y para operación posterior.

### Dependencias descartadas por ahora

- Redis
- Bull
- S3 obligatorio
- IA/OCR
- WebSockets
- Docker como requisito inicial

Estas pueden entrar después si el sistema se estabiliza y el cliente solicita más automatización.

---

## 12. Arquitectura de despliegue

Arquitectura mínima y profesional:

- 1 aplicación backend NestJS
- 1 frontend web administrativo
- 1 base de datos PostgreSQL
- almacenamiento local o volumen controlado para vouchers y PDFs

Producción inicial:

- backend con PM2
- frontend con PM2 o despliegue independiente
- PostgreSQL administrado o en VPS confiable
- backups diarios

---

## 13. Seguridad mínima obligatoria

- autenticación con JWT
- contraseñas hasheadas con bcrypt
- control por roles: `admin` y `operator`
- validación de DTOs
- límites de tamaño de archivo
- whitelist de extensiones para voucher
- auditoría de acciones críticas
- logs de errores

No se debe permitir:

- que operadores eliminen registros sensibles
- que operadores aprueben pagos
- que se repitan operaciones de asistencia o entrega sin advertencia

---

## 14. Prioridades reales de implementación

### Prioridad 1

- autenticación
- usuarios internos
- CRUD de participantes
- pagos y estado de cuenta
- QR
- credencial
- escaneo y control operativo

### Prioridad 2

- actividades
- reportes exportables
- filtros avanzados

### Prioridad 3

- mejoras visuales
- automatizaciones
- notificaciones

---

## 15. Riesgos y decisiones

### Riesgos

- querer automatizar validación de pagos demasiado pronto
- intentar construir SaaS desde el inicio
- agregar offline o móvil sin cerrar primero la operación web
- no definir reglas claras de duplicidad en asistencia y entregas

### Decisiones correctas para esta etapa

- un solo sistema para un solo cliente
- diseño modular pero simple
- aprobación manual de pagos
- QR como eje operativo
- reportes concretos y exportables
- credencial generada desde el sistema

---

## 16. Definición de éxito

El MVP se considera exitoso si logra:

- registrar participantes sin fricción
- mostrar su estado de pago claramente
- generar QR y credencial sin errores
- registrar asistencia y entregas por QR en pocos segundos
- evitar duplicados operativos
- generar reportes utilizables por organización

---

## 17. Recomendación final

La mejor decisión para este cliente es construir un **sistema de gestión operativa de convención**, no una plataforma SaaS.

Tu presentación debe vender estas ideas:

- el sistema está diseñado para resolver la operación real del evento
- el alcance está controlado
- el stack es sólido y mantenible
- la arquitectura permite crecer después, pero sin sacrificar la entrega actual

En términos técnicos, **NestJS + PostgreSQL + un frontend web administrativo** es una decisión correcta, suficiente y profesional para salir a producción con este proyecto.
