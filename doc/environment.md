# Variables d'entorn

Totes les variables d'entorn es carreguen des del fitxer `.env` ubicat a l'arrel del projecte i es centralitzen a `src/config/env.config.ts`. Cap altre fitxer ha de llegir `process.env` directament.

Crea el fitxer `.env` copiant `.env.examle` i omple els valors corresponents.

---

## Referència completa

### Servidor

| Variable | Per defecte | Descripció |
|---|---|---|
| `PORT` | `3000` | Port on escolta el servidor HTTP. |
| `NODE_ENV` | `development` | Entorn d'execució. Valors habituals: `development`, `production`. |

---

### Base de dades

| Variable | Per defecte | Descripció |
|---|---|---|
| `DATABASE_URL` | _(buit)_ | URL de connexió completa a PostgreSQL. Ha d'estar escrita literalment, sense interpolar altres variables del `.env`. |
| `POSTGRES_DB` | — | Nom de la base de dades (usat per Docker Compose). |
| `POSTGRES_USER` | — | Usuari de PostgreSQL (usat per Docker Compose). |
| `POSTGRES_PASSWORD` | — | Contrasenya de PostgreSQL (usat per Docker Compose). |

Exemple de `DATABASE_URL`:

```
DATABASE_URL="postgresql://postgres:prisma@localhost:5432/postgres?schema=public"
```

> Les variables `POSTGRES_*` les llegeix el contenidor Docker directament. La `DATABASE_URL` la llegeix Prisma.

---

### CORS

| Variable | Per defecte | Descripció |
|---|---|---|
| `CORS_ORIGIN` | `http://localhost:5173` | Origen permès per a les peticions cross-origin. Ha de coincidir amb la URL del frontend. |

---

### URLs

| Variable | Per defecte | Descripció |
|---|---|---|
| `FRONTEND_BASE_URL` | Valor de `CORS_ORIGIN` | URL base del frontend. S'utilitza per construir els links de confirmació/cancel·lació de reserves als emails. Si no s'especifica, s'usa el valor de `CORS_ORIGIN`. |
| `API_BASE_URL` | `http://localhost:{PORT}/api` | URL base de l'API. S'utilitza en alguns contexts interns. |

---

### JWT

| Variable | Per defecte | Descripció |
|---|---|---|
| `JWT_SECRET` | `default_secret_key` | Secret per signar i verificar l'`accessToken`. **Canvia-ho en producció.** |
| `JWT_REFRESH_SECRET` | `default_refresh_secret_key` | Secret per signar i verificar el `refreshToken`. **Canvia-ho en producció.** |

> Vegeu [`authentication.md`](./authentication.md) per a una explicació del flux JWT.

---

### Correu electrònic (SMTP)

| Variable | Per defecte | Descripció |
|---|---|---|
| `MAIL_HOST` | `smtp.gmail.com` | Host del servidor SMTP. |
| `MAIL_PORT` | `587` | Port SMTP. `587` per a STARTTLS, `465` per a SSL. |
| `MAIL_SECURE` | `false` | `true` si el port utilitza SSL directe (port 465). |
| `MAIL_USER` | _(buit)_ | Usuari d'autenticació SMTP (normalment l'adreça de correu). |
| `MAIL_PASS` | _(buit)_ | Contrasenya o token d'aplicació SMTP. |
| `MAIL_FROM` | `El Castell <MAIL_USER>` | Adreça remitent que apareix als emails enviats. Si no s'especifica, s'infereix de `MAIL_USER`. |

> Els correus s'envien via el worker d'email. Vegeu [`workers.md`](./workers.md) per a més detalls.

---

## Exemple de fitxer `.env` complet

```
# Servidor
PORT=3000
NODE_ENV=development

# Base de dades (Docker)
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=prisma
DATABASE_URL="postgresql://postgres:prisma@localhost:5432/postgres?schema=public"

# CORS i URLs
CORS_ORIGIN=http://localhost:5173

# JWT
JWT_SECRET=canvia_aquest_secret_en_produccio
JWT_REFRESH_SECRET=canvia_aquest_refresh_secret_en_produccio

# SMTP (exemple Gmail)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=el.teu.compte@gmail.com
MAIL_PASS=la_teva_contrasenya_o_app_token
MAIL_FROM=DishSync <el.teu.compte@gmail.com>
```

> 
