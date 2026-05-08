# Endpoints de l'API

Tots els endpoints estan prefixats amb `/api`. El servidor s'executa per defecte a `http://localhost:3000`.

## Llegenda de rols

| Símbol | Significat |
|---|---|
| Públic | No requereix autenticació |
| `AUTH` | Requereix JWT vàlid en cookie (`accessToken`) |
| `ADMIN` | Requereix rol `ADMIN` |
| `RESPONSABLE` | Requereix rol `RESPONSABLE` |
| `CAMBRER` | Requereix rol `CAMBRER` |
| `RESP/CAM` | Requereix rol `RESPONSABLE` o `CAMBRER` |

---

## Autenticació — `/api/auth`

| Mètode | Ruta | Accés | Descripció |
|---|---|---|---|
| `POST` | `/api/auth/login` | Públic | Inici de sessió. Retorna `accessToken` i `refreshToken` en cookies. |
| `POST` | `/api/auth/register` | Públic | Registre d'un nou usuari intern. |
| `POST` | `/api/auth/logout` | `AUTH` | Tanca la sessió: esborra les cookies i elimina el refresh token de la BD. |
| `POST` | `/api/auth/refresh` | Públic | Renova l'`accessToken` a partir del `refreshToken` de la cookie. |
| `GET` | `/api/auth/me` | `AUTH` | Retorna les dades de l'usuari autenticat. |

---

## Restaurants — `/api/restaurants`

### CRUD d'administració

| Mètode | Ruta | Accés | Descripció |
|---|---|---|---|
| `POST` | `/api/restaurants` | `ADMIN` | Crea un nou restaurant (flux wizard amb imatge multipart). |
| `GET` | `/api/restaurants` | `ADMIN` | Llista tots els restaurants. |
| `GET` | `/api/restaurants/dashboard` | `ADMIN` | Llista de restaurants amb dades resumides per al dashboard. |
| `PUT` | `/api/restaurants/:id` | `ADMIN` | Actualitza les dades completes d'un restaurant. |
| `PATCH` | `/api/restaurants/:id/deactivate` | `ADMIN` | Desactiva un restaurant (`INACTIU`) sense eliminar-lo. |
| `DELETE` | `/api/restaurants/:id` | `ADMIN` | Elimina un restaurant. |

### Validació prèvia (wizard de creació)

| Mètode | Ruta | Accés | Descripció |
|---|---|---|---|
| `GET` | `/api/restaurants/validate-name` | `ADMIN` | Comprova si ja existeix un restaurant amb el nom indicat (`?name=`). |
| `GET` | `/api/restaurants/validate-address` | `ADMIN` | Comprova si ja existeix un restaurant amb l'adreça indicada (`?address=`). |

### Mapa públic

| Mètode | Ruta | Accés | Descripció |
|---|---|---|---|
| `GET` | `/api/restaurants/locations` | Públic | Retorna la llista de restaurants amb coordenades per pintar al mapa (Leaflet/OpenStreetMap). |

### Formulari de reserves (flux públic)

| Mètode | Ruta | Accés | Descripció |
|---|---|---|---|
| `GET` | `/api/restaurants/reservationsForm/:restaurantId` | Públic | Retorna torns i hores disponibles per a una data. |
| `GET` | `/api/restaurants/reservationsForm/:restaurantId/zones` | Públic | Retorna les zones configurades del restaurant. |
| `POST` | `/api/restaurants/reservationsForm/:restaurantId/getTaules` | Públic | Retorna les taules amb estat de reserva filtrades per data, torn, hora i zona. |
| `POST` | `/api/restaurants/reservationsForm/:restaurantId/createReservation` | Públic | Crea una nova reserva de client (estat `PENDENT`, envia email de confirmació). |

### Gestió de reserves per token (flux públic via email)

| Mètode | Ruta | Accés | Descripció |
|---|---|---|---|
| `GET` | `/api/restaurants/reservations/confirm/:token` | Públic | Confirma una reserva a partir del token de l'email (`PENDENT` → `RESERVADA`). |
| `GET` | `/api/restaurants/reservations/cancel/:token` | Públic | Cancel·la una reserva a partir del token de l'email (`CANCELADA`). |

### Gestió de reserves pel personal (flux intern)

| Mètode | Ruta | Accés | Descripció |
|---|---|---|---|
| `POST` | `/api/restaurants/reservationsForm/staff/:restaurantId/createReservation` | `RESP/CAM` | Crea una reserva directa des del personal (sense flux d'email/confirmació). |
| `PATCH` | `/api/restaurants/reservationsForm/:restaurantId/reservations/:reservationId` | `RESP/CAM` | Edita una reserva existent (contacte, taula, torn, data, hora, persones, estat, observacions). |
| `PATCH` | `/api/restaurants/reservationsForm/:restaurantId/reservations/:reservationId/release` | `RESP/CAM` | Allibera una reserva i la deixa en estat `LLIURE`. |

---

## Taules — `/api/taules`

| Mètode | Ruta | Accés | Descripció |
|---|---|---|---|
| `GET` | `/api/taules` | `ADMIN` | Retorna el catàleg de tipus de taula (mobiliari) disponibles per al wizard de creació de restaurant. |

---

## Usuaris — `/api/usuaris`

### Formulari de contacte públic

| Mètode | Ruta | Accés | Descripció |
|---|---|---|---|
| `POST` | `/api/usuaris/contactes` | Públic | Envia un missatge de contacte. Crea o reutilitza el `Client` per email. |

### Gestió d'usuaris (administració)

| Mètode | Ruta | Accés | Descripció |
|---|---|---|---|
| `GET` | `/api/usuaris` | `ADMIN` | Retorna els usuaris disponibles per assignar a un restaurant (wizard). |
| `GET` | `/api/usuaris/allUsers` | `ADMIN` | Retorna tots els usuaris del sistema. |
| `PUT` | `/api/usuaris/:userId` | `ADMIN` | Edita les dades d'un usuari (edició en línia). |
| `DELETE` | `/api/usuaris/:userId` | `ADMIN` | Elimina un usuari. |
| `GET` | `/api/usuaris/validate-email` | `ADMIN` | Comprova si un email ja existeix (`?email=`). |
| `GET` | `/api/usuaris/validate-username` | `ADMIN` | Comprova si un nom d'usuari ja existeix. |

### Gestió de formularis de contacte (administració)

| Mètode | Ruta | Accés | Descripció |
|---|---|---|---|
| `GET` | `/api/usuaris/contactes` | `ADMIN` | Llista tots els missatges de contacte rebuts. |
| `PATCH` | `/api/usuaris/contactes/:contactId/read` | `ADMIN` | Marca un missatge de contacte com a llegit/gestionat. |

### Consulta del restaurant assignat (personal)

| Mètode | Ruta | Accés | Descripció |
|---|---|---|---|
| `GET` | `/api/usuaris/me/restaurant` | `RESP/CAM` | Retorna el restaurant assignat a l'usuari autenticat. |

---

## Plats — `/api/plats`

| Mètode | Ruta | Accés | Descripció |
|---|---|---|---|
| `POST` | `/api/plats` | `ADMIN` | Crea un nou plat (amb imatge multipart). |
| `GET` | `/api/plats` | Públic | Retorna el catàleg complet de plats. |
| `PUT` | `/api/plats/:id` | `ADMIN` | Actualitza un plat existent (amb imatge multipart). |
| `DELETE` | `/api/plats/:id` | `ADMIN` | Elimina un plat. |
| `GET` | `/api/plats/restaurants-menu` | Públic | Retorna la disponibilitat de plats per restaurant (menú públic). |
| `PATCH` | `/api/plats/restaurants/:restaurantId/plats/:platId/availability` | `RESPONSABLE` | Actualitza la disponibilitat d'un plat per a un restaurant concret. |
| `GET` | `/api/plats/categories` | Públic | Retorna totes les categories de plats. |
| `POST` | `/api/plats/categories` | `ADMIN` | Crea una nova categoria de plats. |
