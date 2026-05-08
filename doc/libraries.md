# Llibreries

## Dependències de producció

### Framework i servidor
- **[Express](https://expressjs.com/) `^5.2.1`**
  Framework web minimalista per a Node.js. Gestiona el routing, els middlewares i les peticions/respostes HTTP.

### Base de dades
- **[Prisma Client](https://www.prisma.io/) `^7.4.2`**
  ORM generat automàticament i amb seguretat de tipus per a l'accés a la base de dades. Els tipus s'infereixen directament de `schema.prisma`, eliminant la necessitat de definir models manualment.

- **[pg](https://node-postgres.com/) `^8.19.0`**
  Client PostgreSQL per a Node.js. S'utilitza com a driver de base de dades subjacent per a Prisma.

- **[@prisma/adapter-pg](https://www.prisma.io/docs/orm/overview/databases/postgresql) `^7.4.2`**
  Adaptador oficial de Prisma per a PostgreSQL usant el driver `pg`.

### Validació
- **[Zod](https://zod.dev/) `^4.3.6`**
  Biblioteca de validació d'esquemes amb prioritat per a TypeScript. S'utilitza per validar les dades de les peticions entrants en temps d'execució. Substitueix les interfícies TypeScript simples per als DTOs, ja que persisteix en producció i proporciona validació real de dades.

### Seguretat i autenticació
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js) `^5.x`**
  Biblioteca per fer hash i verificar contrasenyes de manera segura. S'utilitza per xifrar les contrasenyes dels usuaris abans de desar-les a la BD i per verificar-les en el login.

- **[jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) `^9.x`**
  Implementació de JWT (JSON Web Tokens). S'utilitza per generar i verificar l'`accessToken` i el `refreshToken` del flux d'autenticació.

- **[cookie-parser](https://github.com/expressjs/cookie-parser) `^1.x`**
  Middleware d'Express per analitzar les cookies de les peticions HTTP. Permet llegir els tokens JWT enviats en cookies HTTP-only.

- **[cors](https://github.com/expressjs/cors) `^2.8.6`**
  Middleware per habilitar Cross-Origin Resource Sharing (CORS). Configurat via `envConfig.cors.origin`.

### Pujada de fitxers
- **[multer](https://github.com/expressjs/multer) `^1.x`**
  Middleware per gestionar peticions `multipart/form-data`. S'utilitza per a la pujada d'imatges de restaurants i plats.

### Correu electrònic
- **[nodemailer](https://nodemailer.com/) `^6.x`**
  Biblioteca per enviar correus electrònics des de Node.js. S'utilitza per enviar els correus transaccionals de reserves (confirmació, cancel·lació) via SMTP. Configurat a `EmailService`.

### Configuració
- **[dotenv](https://github.com/motdotla/dotenv) `^17.3.1`**
  Carrega variables d'entorn des del fitxer `.env` a `process.env`. Centralitzat a `src/config/env.config.ts`.

---

## Dependències de desenvolupament

### Llenguatge i execució
- **[TypeScript](https://www.typescriptlang.org/) `^5.9.3`**
  Superconjunt de JavaScript amb tipus estàtics. Proporciona comprovació de tipus estàtica durant el desenvolupament. Els tipus i les interfícies s'eliminen en temps de compilació.

- **[tsx](https://github.com/privatenumber/tsx) `^4.21.0`**
  Executor de TypeScript per a Node.js. S'utilitza per executar fitxers `.ts` directament en desenvolupament sense un pas de compilació separat.

- **[ts-node](https://typestrong.org/ts-node/) `^10.9.2`**
  Motor d'execució de TypeScript per a Node.js. S'utilitza com a executor de suport i per a scripts.

### Eines de base de dades
- **[Prisma CLI](https://www.prisma.io/docs/orm/tools/prisma-cli) `^7.4.2`**
  Eina CLI per gestionar migracions de base de dades, generar el client Prisma i executar Prisma Studio.

### Utilitats
- **[nodemon](https://nodemon.io/) `^3.1.14`**
  Monitoritza els canvis de fitxers i reinicia automàticament el servidor durant el desenvolupament.

- **[cross-env](https://github.com/kentcdodds/cross-env) `^10.1.0`**
  Estableix variables d'entorn de manera consistent en diferents sistemes operatius (Windows, macOS, Linux) als scripts npm.

- **[rimraf](https://github.com/isaacs/rimraf)**
  Utilitat `rm -rf` multiplataforma. S'utilitza a l'script `build` per netejar la carpeta `dist/` abans de compilar.

### Definicions de tipus
- **[@types/express](https://www.npmjs.com/package/@types/express) `^5.0.6`**
  Definicions de tipus TypeScript per a Express.

- **[@types/bcrypt](https://www.npmjs.com/package/@types/bcrypt)**
  Definicions de tipus TypeScript per a bcrypt.

- **[@types/jsonwebtoken](https://www.npmjs.com/package/@types/jsonwebtoken)**
  Definicions de tipus TypeScript per a jsonwebtoken.

- **[@types/cookie-parser](https://www.npmjs.com/package/@types/cookie-parser)**
  Definicions de tipus TypeScript per al middleware cookie-parser.

- **[@types/multer](https://www.npmjs.com/package/@types/multer)**
  Definicions de tipus TypeScript per a multer.

- **[@types/nodemailer](https://www.npmjs.com/package/@types/nodemailer)**
  Definicions de tipus TypeScript per a nodemailer.

- **[@types/cors](https://www.npmjs.com/package/@types/cors) `^2.8.19`**
  Definicions de tipus TypeScript per al middleware cors.

- **[@types/node](https://www.npmjs.com/package/@types/node) `^25.3.3`**
  Definicions de tipus TypeScript per als mòduls integrats de Node.js.

- **[@types/pg](https://www.npmjs.com/package/@types/pg) `^8.18.0`**
  Definicions de tipus TypeScript per al client PostgreSQL `pg`.

---

## Scripts

| Script | Comanda | Descripció |
|---|---|---|
| `dev` | `cross-env NODE_ENV=development tsx watch src/server.ts` | Inicia el servidor de desenvolupament amb recàrrega automàtica |
| `build` | `rimraf dist && tsc` | Compila TypeScript a JavaScript |
| `start` | `cross-env NODE_ENV=production node dist/server.js` | Inicia el servidor de producció |
| `db:migrate` | `prisma migrate dev` | Executa les migracions de base de dades en desenvolupament |
| `db:deploy` | `prisma migrate deploy` | Desplega les migracions en producció |
| `db:generate` | `prisma generate` | Regenera el client Prisma després de canvis a l'esquema |
| `db:studio` | `prisma studio` | Obre Prisma Studio (navegador visual de base de dades) |
