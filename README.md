# DishSync Backend

Backend de la aplicación **DishSync**.

API desarrollada con **Node.js**, **Express**, **TypeScript** y **Prisma**, utilizando **PostgreSQL** como base de datos y **Docker** para el entorno de desarrollo.

---

# Requisitos

Antes de ejecutar el proyecto debes tener instalado:

* Node.js (recomendado >= 18)
* Docker
* pnpm

Instalar **pnpm** si no lo tienes:

https://pnpm.io/installation

Ejemplo para Windows (PowerShell):

```
Invoke-WebRequest https://get.pnpm.io/install.ps1 -UseBasicParsing | Invoke-Expression
```

---

# Instalación

Clonar el repositorio e instalar dependencias:

```
pnpm install
```

---

# Variables de entorno

Crear un archivo `.env` en la raíz del proyecto.

Ejemplo:

```
PORT=3000
NODE_ENV=development

POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=prisma

DATABASE_URL="postgresql://postgres:prisma@localhost:5432/postgres?schema=public"
```

> Los valores de `DATABASE_URL` deben estar escritos directamente, sin referenciar otras variables del `.env`, ya que el archivo `.env` no interpola variables.
```

---

# Flujo de desarrollo

Para ejecutar el proyecto en local sigue estos pasos.

## 1. Levantar la base de datos

El proyecto utiliza **PostgreSQL** mediante Docker.

```
docker compose -f docker-compose.postgres.yml up -d
```

Esto iniciará el contenedor de la base de datos.
```
---


## 2. Generar el cliente de Prisma

La primera vez que configures el proyecto, o cada vez que modifiques el `schema.prisma`, debes regenerar el cliente:

```
pnpm db:generate
```

Esto genera los tipos y el cliente de Prisma en `src/generated/client`.

---

## 3. Ejecutar las migraciones de Prisma

Aplica las migraciones para crear las tablas en la base de datos:

```
pnpm db:migrate
```

Este comando crea la migración si el `schema.prisma` cambió, la aplica en la base de datos y regenera el cliente automáticamente.

> Asegúrate de que el contenedor de Docker está corriendo antes de ejecutar este comando.
```
---

## 4. Iniciar el servidor en modo desarrollo

```
pnpm dev
```

El servidor se ejecutará normalmente en:

```
http://localhost:3000
```

El servidor se reiniciará automáticamente cuando se modifique algún archivo TypeScript.

---

## Flujo de trabajo habitual

Una vez configurado el proyecto, el flujo normal de desarrollo es:

1. Levantar la base de datos

```
docker compose -f docker-compose.postgres.yml up -d
```

2. Si cambias el `schema.prisma`, ejecutar migraciones

```
pnpm db:migrate
```

3. Iniciar el servidor

```
pnpm dev
```

---

# Base de datos (herramientas útiles)

Abrir la interfaz gráfica de Prisma:

```
pnpm db:studio
```

Esto abrirá un panel web donde puedes visualizar y modificar los datos de la base de datos.

```
npx tsx prisma/seed.ts
```

Esto permite crear los resitros a traves del seed


---

# Scripts disponibles

```
pnpm dev           # Ejecuta el servidor en desarrollo
pnpm build         # Compila TypeScript a la carpeta dist
pnpm start         # Ejecuta la versión compilada

pnpm db:migrate    # Crea y aplica migraciones con Prisma
pnpm db:deploy     # Aplica migraciones en producción
pnpm db:studio     # Abre la interfaz gráfica de Prisma
```

# Ejecución en producción

## Compilar el proyecto

```
pnpm build
```

## Iniciar el servidor

```
pnpm start
```

---

# Ejecución persistente (opcional)

Si el proyecto se despliega en un servidor, se puede utilizar **pm2** para mantener la aplicación en ejecución.

Instalar pm2 globalmente:

```
pnpm add -g pm2
```

Iniciar el servidor:

```
pm2 start dist/server.js --name dishsync-backend
```

Ver logs:

```
pm2 logs
```
