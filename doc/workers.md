# Workers en segon pla

DishSync utilitza **`worker_threads`** de Node.js per executar tasques asíncrones que no han de bloquejar el fil principal de l'API. Els workers s'ubicen a `src/workers/`.

---

## Per què `worker_threads`?

Tasques com l'enviament de correus electrònics o l'espera temporitzada per expirar reserves poden ser lentes o bloquejar el bucle d'esdeveniments. En delegar-les a un fil separat, el fil principal queda lliure per atendre altres peticions HTTP.

Cada worker s'executa en un fil independent i es comunica amb el fil principal mitjançant missatges (`parentPort.postMessage`).

---

## Worker d'email — `email.worker.ts`

**Fitxer:** `src/workers/email.worker.ts`

S'encarrega d'enviar els correus electrònics transaccionals relacionats amb les reserves, delegant la feina a `EmailService`.

### Tipus de feines (`EmailJob`)

| Tipus | Correu enviat | Quan es dispara |
|---|---|---|
| `PENDING_RESERVATION` | Email de confirmació pendent | Quan es crea una reserva pública (estat `PENDENT`). Conté el link per confirmar o cancel·lar via token. |
| `CONFIRMED_RESERVATION` | Email de reserva confirmada | Quan el client confirma la reserva clicant el link de l'email anterior. |
| `CANCELLED_RESERVATION` | Email de reserva cancel·lada | Quan el client cancel·la la reserva clicant el link de cancel·lació. |

### Funcionament

1. El servei de reserves crea un `Worker` passant-li el tipus de feina i el payload via `workerData`.
2. El worker llegeix `workerData`, identifica el tipus i crida el mètode corresponent de `EmailService`.
3. Quan acaba (amb èxit o error), envia un missatge de retorn al fil principal: `{ success: true }` o `{ success: false, error: "..." }`.

```typescript
// Exemple de com es llença el worker des d'un servei
new Worker('./src/workers/email.worker.cjs', {
    workerData: {
        type: 'PENDING_RESERVATION',
        payload: { ... }
    }
});
```

> L'`EmailService` utilitza **Nodemailer** configurat amb les variables SMTP de `env.config.ts`.

---

## Worker d'expiració de reserves — `reservation-expiry.worker.ts`

**Fitxer:** `src/workers/reservation-expiry.worker.ts`

S'encarrega d'expirar automàticament les reserves que no es confirmen dins d'un temps límit.

### Funcionament

1. Quan es crea una reserva pública amb estat `PENDENT`, el servei de reserves llença aquest worker passant l'`id` de la reserva.
2. El worker **espera 2 minuts** (temporitzador intern).
3. Passat el temps, consulta la reserva a la BD:
   - Si l'estat segueix sent `PENDENT` (el client no ha confirmat ni cancel·lat), l'actualitza a `EXPIRADA`.
   - Si ja ha canviat d'estat (confirmat, cancel·lat, etc.), no fa res.
4. Desconnecta Prisma i finalitza el fil.

```
Worker llençat
    └── setTimeout(2 min)
          └── prisma.reserva.findUnique(reservaId)
                ├── estat === PENDENT → UPDATE estat = EXPIRADA
                └── estat !== PENDENT → no fa res
```

### Per què 2 minuts?

El temps de confirmació ha de ser prou curt per alliberar taules ràpidament en cas que el client no completi el flux, però suficient per permetre que l'email arribi i el client cliqui el link.

---

## Fitxers `.cjs` de bootstrap

Node.js no pot importar fitxers `.ts` directament en `worker_threads`. Per això cada worker té un fitxer `.cjs` associat que actua com a punt d'entrada per al `Worker`:

```
src/workers/
├── email.worker.ts               # Codi font TypeScript
├── email.worker.cjs              # Bootstrap per a worker_threads
├── reservation-expiry.worker.ts  # Codi font TypeScript
└── reservation-expiry.worker.cjs # Bootstrap per a worker_threads
```

El fitxer `.cjs` simplement carrega `tsx` o `ts-node` per poder executar el `.ts` corresponent dins el context del worker.
