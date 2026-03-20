# Guía de Despliegue en Coolify (pnpm Monorepo)

Esta guía detalla cómo configurar el proyecto **EventManager** en Coolify utilizando **Nixpacks** y separando los recursos de Backend (API) y Frontend (Web).

## 1. Preparación en GitHub
1. Asegúrate de haber subido tu código a un repositorio de GitHub (ya hemos inicializado git localmente).
2. Conecta tu cuenta de GitHub en Coolify (Sources > GitHub App).

## 2. Recurso Backend (NestJS API)
En Coolify, añade un nuevo **Application** desde tu repositorio y configúralo así:

*   **Nombre**: `api-event-manager` (o el que prefieras)
*   **Base Directory**: `/` (Raíz del proyecto)
*   **Install Command**: `pnpm install`
*   **Build Command**: `pnpm --filter api build`
*   **Start Command**: `pnpm --filter api start:prod`
*   **Port**: `3000` (Verifica que sea el mismo que en tu `.env`)
*   **Environment Variables**:
    *   Copia las variables de tu `.env` (DB_HOST, JWT_SECRET, etc.).
    *   **Importante**: `DB_HOST` debe apuntar al nombre del servicio de la BD en Coolify (ej: `postgresql`) o su IP interna.

## 3. Recurso Frontend (Next.js Web)
Añade otra **Application** desde el mismo repositorio:

*   **Nombre**: `web-event-manager`
*   **Base Directory**: `/` (Raíz del proyecto)
*   **Install Command**: `pnpm install`
*   **Build Command**: `pnpm --filter web build`
*   **Start Command**: `pnpm --filter web start`
*   **Port**: `3001` (O el que use Next.js por defecto: 3000 si no se especifica)
*   **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: La URL pública de tu API (ej: `https://api.tu-dominio.com`).

## 4. Base de Datos (PostgreSQL)
Como mencionaste que te encargarás tú:
1. Crea un recurso **PostgreSQL** en Coolify.
2. Anota el Host, Puerto, Usuario, Contraseña y Nombre de la BD.
3. Asegúrate de que tanto la API como la Web estén en el mismo **Network** de Coolify para que puedan comunicarse fácilmente.

## Notas Adicionales
*   **pnpm**: Coolify/Nixpacks detectará automáticamente `pnpm` debido al archivo `pnpm-lock.yaml` y `pnpm-workspace.yaml` en la raíz.
*   **Health Checks**: Puedes configurar un health check en la API apuntando a `/api/health` (si existe) o simplemente `/`.
