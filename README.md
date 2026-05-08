# DishSync Backend

## Què és DishSync?

**DishSync** és una plataforma de gestió integral per a restaurants. Permet administrar múltiples establiments, configurar zones i taules de sala, gestionar reserves de clients i controlar la carta de plats i la seva disponibilitat per restaurant.

## Què fa aquesta API?

Aquesta API REST és el nucli del sistema. Proporciona tots els endpoints que consumeix tant el panell d'administració com el portal públic de reserves. Les principals àrees de funcionalitat són:

- **Gestió de restaurants** — alta, edició, desactivació i consulta d'establiments amb geolocalització.
- **Zones i taules** — configuració del plànol de sala: zones, tipus de taula i instàncies físiques per restaurant.
- **Reserves** — flux públic de reserva amb confirmació/cancel·lació per token via correu electrònic, i flux intern de gestió per part del personal (cambrer i responsable).
- **Plats i carta** — catàleg global de plats i categories, amb disponibilitat per restaurant gestionable pel responsable.
- **Autenticació i personal** — login/logout amb JWT en cookie, refresh token, i control d'accés per rols (`ADMIN`, `RESPONSABLE`, `CAMBRER`).
- **Formulari de contacte** — enviament i gestió de missatges de clients.
- **Workers en segon pla** — enviament d'emails transaccionals (Nodemailer) i expiració automàtica de reserves no confirmades.

## Stack tecnològic

| Capa | Tecnologia |
|---|---|
| Servidor | Node.js + Express 5 |
| Llenguatge | TypeScript |
| ORM | Prisma 7 |
| Base de dades | PostgreSQL (via Docker en local) |
| Validació | Zod |
| Autenticació | JWT (jsonwebtoken) + cookies |
| Fitxers | Multer |
| Correu | Nodemailer |

> Per a documentació detallada consulta la carpeta [`doc/`](./doc/).

---

Backend de l'aplicació **DishSync**.

API desenvolupada amb **Node.js**, **Express**, **TypeScript** i **Prisma**, utilitzant **PostgreSQL** com a base de dades i **Docker** per a l'entorn de desenvolupament.

---

## Requisits

Abans d'executar el projecte has de tenir instal·lat:

* Node.js (recomendado >= 18)
* Docker
* pnpm

Instal·la **pnpm** si no el tens:

https://pnpm.io/installation

Exemple per a Windows (PowerShell):

```
Invoke-WebRequest https://get.pnpm.io/install.ps1 -UseBasicParsing | Invoke-Expression
```

---

## Instal·lació

Clona el repositori i instal·la les dependències:

```
pnpm install
```

---

## Variables d'entorn

Crea un fitxer `.env` a l'arrel del projecte.

Exemple:

```
PORT=3000
NODE_ENV=development

POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=prisma

DATABASE_URL="postgresql://postgres:prisma@localhost:5432/postgres?schema=public"
```

> Els valors de `DATABASE_URL` s'han d'escriure directament, sense referenciar altres variables del `.env`, ja que el fitxer `.env` no interpola variables.
```

---

## Flux de desenvolupament

Per executar el projecte en local segueix aquests passos.

### 1. Posar en marxa la base de dades

El projecte utilitza **PostgreSQL** mitjançant Docker.

```
docker compose -f docker-compose.postgres.yml up -d
```

Això iniciarà el contenidor de la base de dades.
```
---


### 2. Generar el client de Prisma

La primera vegada que configuris el projecte, o cada vegada que modifiquis el `schema.prisma`, has de regenerar el client:

```
pnpm db:generate
```

Això genera els tipus i el client de Prisma a `src/generated/client`.

---

### 3. Executar les migracions de Prisma

Aplica les migracions per crear les taules a la base de dades:

```
pnpm db:migrate
```

Aquesta comanda crea la migració si el `schema.prisma` ha canviat, l'aplica a la base de dades i regenera el client automàticament.

> Assegura't que el contenidor de Docker està en execució abans d'executar aquesta comanda.
```
---

### 4. Iniciar el servidor en mode desenvolupament

```
pnpm dev
```

El servidor s'executarà normalment a:

```
http://localhost:3000
```

El servidor es reiniciarà automàticament quan es modifiqui algun fitxer TypeScript.

---

## Flux de treball habitual

Un cop configurat el projecte, el flux normal de desenvolupament és:

1. Posar en marxa la base de dades

```
docker compose -f docker-compose.postgres.yml up -d
```

2. Si canvies el `schema.prisma`, executar migracions

```
pnpm db:migrate
```

3. Iniciar el servidor

```
pnpm dev
```

---

## Base de dades (eines útils)

Obrir la interfície gràfica de Prisma:

```
pnpm db:studio
```

Això obrirà un panell web on pots visualitzar i modificar les dades de la base de dades.

```
npx tsx prisma/seed.ts
```

Això permet crear els registres a través del seed


---

## Scripts disponibles

```
pnpm dev           # Executa el servidor en desenvolupament
pnpm build         # Compila TypeScript a la carpeta dist
pnpm start         # Executa la versió compilada

pnpm db:migrate    # Crea i aplica migracions amb Prisma
pnpm db:deploy     # Aplica migracions en producció
pnpm db:studio     # Obre la interfície gràfica de Prisma
```

## Execució en producció

### Compilar el projecte

```
pnpm build
```

### Iniciar el servidor

```
pnpm start
```

---

## Execució persistent (opcional)

Si el projecte es desplega en un servidor, es pot utilitzar **pm2** per mantenir l'aplicació en execució.

Instal·lar pm2 globalment:

```
pnpm add -g pm2
```

Iniciar el servidor:

```
pm2 start dist/server.js --name dishsync-backend
```

Veure logs:

```
pm2 logs
```
