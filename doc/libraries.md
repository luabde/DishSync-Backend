# Libraries

## Production Dependencies

### Framework & Server
- **[Express](https://expressjs.com/) `^5.2.1`**
  Fast, minimalist web framework for Node.js. Handles routing, middleware, and HTTP requests/responses.

### Database
- **[Prisma Client](https://www.prisma.io/) `^7.4.2`**
  Auto-generated, type-safe ORM for database access. Types are inferred directly from `schema.prisma`, eliminating the need for manual model definitions.

- **[pg](https://node-postgres.com/) `^8.19.0`**
  PostgreSQL client for Node.js. Used as the underlying database driver for Prisma.

- **[@prisma/adapter-pg](https://www.prisma.io/docs/orm/overview/databases/postgresql) `^7.4.2`**
  Official Prisma adapter for PostgreSQL using the `pg` driver.

### Validation
- **[Zod](https://zod.dev/) `^4.3.6`**
  TypeScript-first schema validation library. Used to validate incoming request data at runtime. Replaces plain TypeScript interfaces for DTOs, as it persists in production and provides real data validation.

### Security & Auth
- **[cors](https://github.com/expressjs/cors) `^2.8.6`**
  Middleware to enable Cross-Origin Resource Sharing (CORS). Configured via `envConfig.cors.origin`.

### Configuration
- **[dotenv](https://github.com/motdotla/dotenv) `^17.3.1`**
  Loads environment variables from `.env` file into `process.env`. Centralized in `src/config/env.config.ts`.

---

## Development Dependencies

### Language & Runtime
- **[TypeScript](https://www.typescriptlang.org/) `^5.9.3`**
  Typed superset of JavaScript. Provides static type checking during development. Types and interfaces are stripped at compile time.

- **[tsx](https://github.com/privatenumber/tsx) `^4.21.0`**
  TypeScript executor for Node.js. Used to run `.ts` files directly in development without a separate compilation step.

- **[ts-node](https://typestrong.org/ts-node/) `^10.9.2`**
  TypeScript execution engine for Node.js. Used as a fallback runner and for scripts.

### Database Tooling
- **[Prisma CLI](https://www.prisma.io/docs/orm/tools/prisma-cli) `^7.4.2`**
  CLI tool for managing database migrations, generating the Prisma Client, and running Prisma Studio.

### Utilities
- **[nodemon](https://nodemon.io/) `^3.1.14`**
  Monitors file changes and automatically restarts the server during development.

- **[cross-env](https://github.com/kentcdodds/cross-env) `^10.1.0`**
  Sets environment variables across different operating systems (Windows, macOS, Linux) in npm scripts.

- **[rimraf](https://github.com/isaacs/rimraf)**
  Cross-platform `rm -rf` utility. Used in the `build` script to clean the `dist/` folder before compiling.

### Type Definitions
- **[@types/express](https://www.npmjs.com/package/@types/express) `^5.0.6`**
  TypeScript type definitions for Express.

- **[@types/cors](https://www.npmjs.com/package/@types/cors) `^2.8.19`**
  TypeScript type definitions for the cors middleware.

- **[@types/node](https://www.npmjs.com/package/@types/node) `^25.3.3`**
  TypeScript type definitions for Node.js built-in modules.

- **[@types/pg](https://www.npmjs.com/package/@types/pg) `^8.18.0`**
  TypeScript type definitions for the `pg` PostgreSQL client.

---

## Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `cross-env NODE_ENV=development tsx watch src/server.ts` | Start development server with hot reload |
| `build` | `rimraf dist && tsc` | Compile TypeScript to JavaScript |
| `start` | `cross-env NODE_ENV=production node dist/server.js` | Start production server |
| `db:migrate` | `prisma migrate dev` | Run database migrations in development |
| `db:deploy` | `prisma migrate deploy` | Deploy migrations in production |
| `db:generate` | `prisma generate` | Regenerate Prisma Client after schema changes |
| `db:studio` | `prisma studio` | Open Prisma Studio (visual database browser) |