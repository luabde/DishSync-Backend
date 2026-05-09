# Base de dades en producció — Supabase + Prisma

## Visió general

El backend utilitza **Prisma ORM** per gestionar la base de dades PostgreSQL allotjada a **Supabase**. Hi ha una distinció important entre dos contextos d'ús que cal entendre bé: la CLI de Prisma (migracions, seed) i el servidor en runtime (queries).

---

## Les dues URLs i per què existeixen

Supabase proporciona tres tipus de connexió per a cada projecte. Nosaltres utilitzem dues:

### `DIRECT_URL` — Connexió directa (port 5432)

```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

O bé el **Session Pooler** (recomanat si la xarxa local és IPv4):

```
postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

**Qui l'usa:** La CLI de Prisma (`prisma migrate`, `prisma generate`, `prisma studio`).  
**Per què:** Les migracions necessiten una connexió directa i persistent. No és compatible amb el mode transacció del pooler.  
**On es configura:** `prisma.config.ts` → `datasource.url`.  
**Quan s'usa:** Només des de la màquina local del desenvolupador, mai des del servidor en producció.

---

### `DATABASE_URL` — Transaction Pooler amb Supavisor (port 6543)

```
postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Qui l'usa:** El `PrismaClient` en runtime (totes les queries de l'aplicació).  
**Per què:** El pooler gestiona les connexions eficientment, evitant exhaurir el límit de connexions simultànies de la base de dades.  
**On es configura:** Variable d'entorn llegida per `prisma.loader.ts`.  
**Quan s'usa:** Sempre que el servidor està en execució, tant en local com en producció.  
**Nota important:** El paràmetre `?pgbouncer=true` és obligatori. Supavisor en mode transacció no suporta prepared statements; aquest flag els desactiva a Prisma.

---

## Diagrama de fluxe

```
DESENVOLUPAMENT LOCAL
─────────────────────────────────────────────────────
  CLI de Prisma                    Servidor (tsx watch)
  (migrate, seed, studio)          (src/server.ts)
        │                                │
   DIRECT_URL                      DATABASE_URL
   (connexió directa)              (pooler + pgbouncer)
        │                                │
        └──────────────┬─────────────────┘
                       │
               Supabase PostgreSQL


PRODUCCIÓ
─────────────────────────────────────────────────────
  Màquina local del dev            Servidor desplegat
  (abans del deploy)               (node dist/server.js)
        │                                │
   DIRECT_URL                      DATABASE_URL
   pnpm db:deploy                  (variable d'entorn
   (aplica migracions)              al proveïdor)
        │                                │
        └──────────────┬─────────────────┘
                       │
               Supabase PostgreSQL
```

---

## Fitxers implicats i el seu rol

### `prisma.config.ts`
Configuració de la CLI de Prisma. Apunta a `DIRECT_URL` per a migracions.  
**No s'inclou al `dist`** — és exclusiu de l'entorn de desenvolupament.

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"), // CLI de Prisma: migracions i eines
  },
});
```

### `src/loaders/prisma.loader.ts`
Instancia el `PrismaClient` amb el driver adapter `PrismaPg`. Llegeix `DATABASE_URL` (el pooler) en runtime.  
**Sí s'inclou al `dist`** — és el codi que executa el servidor.

```typescript
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
return new PrismaClient({ adapter });
```

---

## Variables d'entorn

### `.env` local (desenvolupament)

```dotenv
# Runtime — PrismaClient (pooler Supavisor, port 6543)
DATABASE_URL="postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# CLI — Migracions (connexió directa o session pooler, port 5432)
DIRECT_URL="postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

> Les variables `POSTGRES_DB`, `POSTGRES_USER` i `POSTGRES_PASSWORD` eren exclusives de Docker en desenvolupament local. No s'usen a Supabase ni en producció.

### Proveïdor de producció (Railway, Render, Fly.io...)

Configurar **únicament** `DATABASE_URL` al panell de variables d'entorn del proveïdor. La `DIRECT_URL` no cal en producció perquè les migracions es llancen des de local.

---

## Flux de treball per desplegar canvis

### Primer desplegament (ja realitzat)

```bash
# 1. Aplicar totes les migracions existents a Supabase
pnpm db:deploy

# 2. Executar el seed amb dades inicials (opcional)
pnpm prisma db seed
```

### Canvis de schema posteriors (workflow habitual)

```bash
# 1. Modificar prisma/schema.prisma localment

# 2. Crear la migració en local (contra Docker o Supabase)
pnpm db:migrate

# 3. Aplicar la migració a Supabase producció
pnpm db:deploy

# 4. Compilar i desplegar el backend
pnpm build
# → pujar el dist al proveïdor
```

> **Mai** executar `prisma migrate dev` contra la base de dades de producció. Aquest comandament és exclusiu de desenvolupament.

---

## Comandes de referència

| Comanda | Descripció | Entorn |
|---|---|---|
| `pnpm db:migrate` | Crea una nova migració i l'aplica | Local (dev) |
| `pnpm db:deploy` | Aplica les migracions pendents | Local → Producció |
| `pnpm db:generate` | Regenera el client de Prisma | Local |
| `pnpm db:studio` | Obre Prisma Studio (GUI de la BD) | Local |
| `pnpm prisma db seed` | Executa el seed de dades | Local |

---

## Notes addicionals

- El client generat de Prisma (`generated/prisma`) es regenera automàticament en cada `pnpm install` gràcies al script `postinstall: prisma generate` del `package.json`.
- El `prisma.config.ts` **no intervé en runtime**. Quan el servidor s'executa amb `node dist/server.js`, aquest fitxer no existeix ni és llegit.
- Supabase Storage s'utilitza per a l'emmagatzematge d'imatges (plats, etc.), substituint el disc local que s'usava en desenvolupament amb Docker.