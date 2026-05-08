import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DishSync API",
      version: "1.0.0",
      description:
        "API REST de DishSync — plataforma de gestió integral per a restaurants. Permet administrar establiments, zones i taules, reserves de clients, carta de plats i personal.",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Servidor de desenvolupament",
      },
    ],
    tags: [
      { name: "Auth", description: "Autenticació i gestió de sessió del personal" },
      { name: "Restaurants", description: "CRUD de restaurants, zones, taules i reserves" },
      { name: "Taules", description: "Catàleg de tipus de taula" },
      { name: "Usuaris", description: "Gestió d'usuaris i formulari de contacte" },
      { name: "Plats", description: "Catàleg de plats, categories i disponibilitat" },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "access_token",
          description: "Cookie HTTP-only amb el JWT d'accés. S'estableix automàticament en fer login.",
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────────────────────────────────
        LoginBody: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "admin@dishsync.com" },
            password: { type: "string", minLength: 6, example: "secret123" },
          },
        },
        RegisterBody: {
          type: "object",
          required: ["nom", "cognoms", "email", "password", "rol"],
          properties: {
            nom: { type: "string", example: "Maria" },
            cognoms: { type: "string", example: "Garcia Puig" },
            email: { type: "string", format: "email", example: "maria@restaurant.com" },
            password: { type: "string", minLength: 6, example: "secret123" },
            rol: { type: "string", enum: ["ADMIN", "RESPONSABLE", "CAMBRER"], example: "CAMBRER" },
            estat: { type: "string", enum: ["ACTIU", "INACTIU"], default: "ACTIU" },
            restaurant: { type: "integer", nullable: true, example: 1 },
          },
        },
        AuthUser: {
          type: "object",
          properties: {
            userId: { type: "integer", example: 1 },
            nom: { type: "string", example: "Maria" },
            email: { type: "string", example: "maria@restaurant.com" },
            rol: { type: "string", enum: ["ADMIN", "RESPONSABLE", "CAMBRER"] },
          },
        },

        // ── Restaurants ───────────────────────────────────────────────────────
        RestaurantBody: {
          type: "object",
          required: ["nom", "direccio", "horaris", "telefon"],
          properties: {
            nom: { type: "string", example: "El Castell" },
            direccio: { type: "string", example: "Carrer Major, 10, Barcelona" },
            horaris: { type: "string", example: "Dl-Dv 13:00-16:00 i 20:00-23:00" },
            telefon: { type: "string", minLength: 9, example: "934567890" },
            url: { type: "string", description: "URL d'imatge existent (opcional si s'envia fitxer)", example: "" },
            descripcio: { type: "string", example: "Restaurant de cuina catalana al cor de Barcelona" },
            wizardData: {
              type: "object",
              description: "Dades del wizard de creació (torns, zones, taules, usuaris assignats)",
              properties: {
                shifts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string", example: "Dinar" },
                      times: { type: "array", items: { type: "string", example: "13:00" } },
                    },
                  },
                },
                zones: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string", example: "Terrassa" },
                    },
                  },
                },
                selectedUsers: {
                  type: "array",
                  items: { type: "object", properties: { id: { type: "integer" } } },
                },
                tablesByZone: {
                  type: "object",
                  additionalProperties: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        tableTypeId: { type: "integer" },
                        x: { type: "integer" },
                        y: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        UpdateRestaurantBody: {
          type: "object",
          required: ["nom", "direccio", "telefon"],
          properties: {
            nom: { type: "string", example: "El Castell" },
            direccio: { type: "string", example: "Carrer Major, 10, Barcelona" },
            telefon: { type: "string", minLength: 9, example: "934567890" },
            url: { type: "string", example: "" },
            descripcio: { type: "string", example: "Descripció actualitzada" },
          },
        },
        RestaurantLocation: {
          type: "object",
          properties: {
            id: { type: "integer" },
            nom: { type: "string" },
            direccio: { type: "string" },
            descripcio: { type: "string", nullable: true },
            horaris: { type: "string" },
            url: { type: "string", nullable: true },
            lat: { type: "number", nullable: true },
            lng: { type: "number", nullable: true },
            estat: { type: "string", enum: ["ACTIU", "INACTIU"] },
          },
        },

        // ── Reserves ─────────────────────────────────────────────────────────
        CreateReservationBody: {
          type: "object",
          required: ["nom", "email", "telefon", "id_taula_restaurant", "id_torn", "data", "hora", "num_persones"],
          properties: {
            nom: { type: "string", example: "Joan Martí" },
            cognoms: { type: "string", example: "Puig" },
            email: { type: "string", format: "email", example: "joan@example.com" },
            telefon: { type: "string", minLength: 9, example: "612345678" },
            id_taula_restaurant: { type: "integer", example: 3 },
            id_torn: { type: "integer", example: 1 },
            data: { type: "string", format: "date", example: "2026-06-15" },
            hora: { type: "string", example: "13:30" },
            num_persones: { type: "integer", minimum: 1, example: 2 },
            observacions: { type: "string", example: "Al·lèrgia als fruits secs" },
          },
        },
        CreateReservationByStaffBody: {
          type: "object",
          required: ["nom", "telefon", "id_taula_restaurant", "id_torn", "data", "hora", "num_persones", "estat"],
          properties: {
            nom: { type: "string", example: "Joan Martí" },
            cognoms: { type: "string", example: "Puig" },
            email: { type: "string", format: "email", example: "joan@example.com" },
            telefon: { type: "string", minLength: 9, example: "612345678" },
            id_taula_restaurant: { type: "integer", example: 3 },
            id_torn: { type: "integer", example: 1 },
            data: { type: "string", format: "date", example: "2026-06-15" },
            hora: { type: "string", example: "13:30" },
            num_persones: { type: "integer", minimum: 1, example: 2 },
            estat: { type: "string", enum: ["RESERVADA", "OCUPADA"], example: "RESERVADA" },
            observacions: { type: "string", example: "Taula finestra" },
          },
        },
        UpdateReservationByStaffBody: {
          type: "object",
          required: ["id_taula_restaurant", "id_torn", "data", "hora", "num_persones", "estat"],
          properties: {
            nom_contacte: { type: "string", example: "Joan Martí Puig" },
            id_taula_restaurant: { type: "integer", example: 3 },
            id_torn: { type: "integer", example: 1 },
            data: { type: "string", format: "date", example: "2026-06-15" },
            hora: { type: "string", example: "13:30" },
            num_persones: { type: "integer", minimum: 1, example: 2 },
            estat: { type: "string", enum: ["RESERVADA", "OCUPADA", "LLIURE"], example: "RESERVADA" },
            observacions: { type: "string", example: "Actualitzat des de sala" },
          },
        },
        GetTaulesBody: {
          type: "object",
          required: ["data", "id_torn", "hora"],
          properties: {
            data: { type: "string", format: "date", example: "2026-06-15" },
            id_torn: { type: "integer", example: 1 },
            hora: { type: "string", example: "13:30" },
            zona: { type: "integer", nullable: true, example: 2 },
          },
        },

        // ── Plats ─────────────────────────────────────────────────────────────
        PlatBody: {
          type: "object",
          required: ["nom", "descripcio", "preu", "id_categoria"],
          properties: {
            nom: { type: "string", example: "Croquetes de bacallà" },
            descripcio: { type: "string", example: "Croquetes casolanes amb bacallà de qualitat" },
            preu: { type: "number", format: "float", minimum: 0, example: 8.5 },
            id_categoria: { type: "integer", example: 1 },
            url: { type: "string", example: "" },
          },
        },
        UpdatePlatBody: {
          type: "object",
          required: ["nom", "descripcio", "preu", "id_categoria"],
          properties: {
            nom: { type: "string", example: "Croquetes de bacallà" },
            descripcio: { type: "string", example: "Descripció actualitzada" },
            preu: { type: "number", format: "float", minimum: 0, example: 9.0 },
            id_categoria: { type: "integer", example: 1 },
            url: { type: "string", example: "" },
          },
        },
        CategoriaBody: {
          type: "object",
          required: ["nom"],
          properties: {
            nom: { type: "string", example: "Entrants" },
            descripcio: { type: "string", example: "Plats per compartir" },
          },
        },
        UpdatePlatAvailabilityBody: {
          type: "object",
          required: ["disponibilitat"],
          properties: {
            disponibilitat: { type: "boolean", example: false },
          },
        },

        // ── Usuaris / Contacte ────────────────────────────────────────────────
        ContacteBody: {
          type: "object",
          required: ["nom", "cognoms", "email", "telefon", "missatge"],
          properties: {
            nom: { type: "string", example: "Laura" },
            cognoms: { type: "string", example: "Soler Mas" },
            email: { type: "string", format: "email", example: "laura@example.com" },
            telefon: { type: "string", minLength: 9, example: "634567890" },
            missatge: { type: "string", example: "Voldria fer una reserva per a un grup gran" },
          },
        },

        // ── Errors ────────────────────────────────────────────────────────────
        ErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            message: { type: "string", example: "Descripció de l'error" },
          },
        },
      },
    },
    paths: {
      // ════════════════════════════════════════════════════════════════════════
      // AUTH
      // ════════════════════════════════════════════════════════════════════════
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Inici de sessió",
          description: "Autentica un usuari intern i estableix les cookies `access_token` i `refresh_token`.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginBody" } } },
          },
          responses: {
            200: {
              description: "Login correcte",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string", example: "Login exitoso" },
                      user: { $ref: "#/components/schemas/AuthUser" },
                    },
                  },
                },
              },
            },
            400: { description: "Dades invàlides", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            401: { description: "Credencials incorrectes", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Registre d'usuari intern",
          description: "Crea un nou usuari intern (ADMIN, RESPONSABLE o CAMBRER).",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterBody" } } },
          },
          responses: {
            201: { description: "Usuari creat correctament" },
            400: { description: "Dades invàlides", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            409: { description: "Email o nom d'usuari ja existeix", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Tancament de sessió",
          description: "Esborra les cookies de sessió i elimina el refresh token de la BD.",
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: "Logout correcte" },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Renovació del token d'accés",
          description: "Genera un nou `access_token` a partir del `refresh_token` de la cookie.",
          responses: {
            200: { description: "Token renovat correctament" },
            401: { description: "Refresh token invàlid o expirat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Dades de l'usuari autenticat",
          description: "Retorna les dades decodificades del JWT de l'usuari en sessió.",
          security: [{ cookieAuth: [] }],
          responses: {
            200: {
              description: "Dades de l'usuari",
              content: { "application/json": { schema: { type: "object", properties: { user: { $ref: "#/components/schemas/AuthUser" } } } } },
            },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // RESTAURANTS — CRUD
      // ════════════════════════════════════════════════════════════════════════
      "/restaurants": {
        get: {
          tags: ["Restaurants"],
          summary: "Llista tots els restaurants",
          description: "Retorna tots els restaurants del sistema. Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: "Llista de restaurants" },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
        post: {
          tags: ["Restaurants"],
          summary: "Crea un nou restaurant",
          description: "Alta d'un restaurant amb tota la configuració del wizard (zones, torns, taules, usuaris). Accepta `multipart/form-data` per pujar imatge. Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/RestaurantBody" },
                    {
                      type: "object",
                      properties: {
                        image: { type: "string", format: "binary", description: "Imatge del restaurant (max 5MB)" },
                        wizardData: { type: "string", description: "JSON serialitzat amb les dades del wizard" },
                      },
                    },
                  ],
                },
              },
            },
          },
          responses: {
            201: { description: "Restaurant creat correctament" },
            400: { description: "Dades invàlides", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/restaurants/dashboard": {
        get: {
          tags: ["Restaurants"],
          summary: "Dashboard de restaurants",
          description: "Retorna estadístiques globals (restaurants actius/inactius, usuaris, reserves avui/setmana) i dades per restaurant. Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: "Dades del dashboard" },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/restaurants/validate-name": {
        get: {
          tags: ["Restaurants"],
          summary: "Valida si un nom de restaurant ja existeix",
          security: [{ cookieAuth: [] }],
          parameters: [{ name: "name", in: "query", required: true, schema: { type: "string" }, description: "Nom a comprovar" }],
          responses: {
            200: { description: "Resultat de la validació" },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/restaurants/validate-address": {
        get: {
          tags: ["Restaurants"],
          summary: "Valida si una adreça de restaurant ja existeix",
          security: [{ cookieAuth: [] }],
          parameters: [{ name: "address", in: "query", required: true, schema: { type: "string" }, description: "Adreça a comprovar" }],
          responses: {
            200: { description: "Resultat de la validació" },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/restaurants/locations": {
        get: {
          tags: ["Restaurants"],
          summary: "Localitzacions públiques dels restaurants",
          description: "Retorna els restaurants actius amb coordenades per al mapa públic (Leaflet/OpenStreetMap). No requereix autenticació.",
          responses: {
            200: {
              description: "Llista de localitzacions",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/RestaurantLocation" } },
                },
              },
            },
          },
        },
      },
      "/restaurants/{id}": {
        put: {
          tags: ["Restaurants"],
          summary: "Actualitza un restaurant",
          description: "Actualitza les dades d'un restaurant existent. Accepta `multipart/form-data` per canviar la imatge. Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID del restaurant" }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/UpdateRestaurantBody" },
                    { type: "object", properties: { image: { type: "string", format: "binary" } } },
                  ],
                },
              },
            },
          },
          responses: {
            200: { description: "Restaurant actualitzat correctament" },
            400: { description: "Dades invàlides", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            404: { description: "Restaurant no trobat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
        delete: {
          tags: ["Restaurants"],
          summary: "Elimina un restaurant",
          description: "Elimina un restaurant si no té reserves futures. Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID del restaurant" }],
          responses: {
            200: { description: "Restaurant eliminat correctament" },
            400: { description: "El restaurant té reserves futures", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            404: { description: "Restaurant no trobat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/restaurants/{id}/deactivate": {
        patch: {
          tags: ["Restaurants"],
          summary: "Desactiva un restaurant",
          description: "Canvia l'estat d'un restaurant a INACTIU sense eliminar-lo ni el seu historial. Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID del restaurant" }],
          responses: {
            200: { description: "Restaurant desactivat correctament" },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            404: { description: "Restaurant no trobat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // RESTAURANTS — FORMULARI DE RESERVES (públic)
      // ════════════════════════════════════════════════════════════════════════
      "/restaurants/reservationsForm/{restaurantId}": {
        get: {
          tags: ["Restaurants"],
          summary: "Torns i hores disponibles per a una data",
          description: "Retorna els torns i els seus slots horaris per al restaurant i la data indicats. Si la data és avui, filtra les hores passades.",
          parameters: [
            { name: "restaurantId", in: "path", required: true, schema: { type: "integer" } },
            { name: "data", in: "query", required: false, schema: { type: "string", format: "date" }, description: "Data seleccionada (YYYY-MM-DD)" },
          ],
          responses: {
            200: { description: "Llista de torns amb hores disponibles" },
            500: { description: "Error intern", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/restaurants/reservationsForm/{restaurantId}/zones": {
        get: {
          tags: ["Restaurants"],
          summary: "Zones del restaurant per al formulari",
          description: "Retorna les zones configurades del restaurant per al selector del formulari de reserves públic.",
          parameters: [{ name: "restaurantId", in: "path", required: true, schema: { type: "integer" } }],
          responses: {
            200: { description: "Llista de zones" },
            500: { description: "Error intern", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/restaurants/reservationsForm/{restaurantId}/getTaules": {
        post: {
          tags: ["Restaurants"],
          summary: "Taules amb estat de reserva",
          description: "Retorna totes les taules de la zona seleccionada amb el seu estat de reserva per a la data, torn i hora indicats.",
          parameters: [{ name: "restaurantId", in: "path", required: true, schema: { type: "integer" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/GetTaulesBody" } } },
          },
          responses: {
            200: { description: "Llista de taules amb estat de reserva" },
            400: { description: "Dades invàlides", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/restaurants/reservationsForm/{restaurantId}/createReservation": {
        post: {
          tags: ["Restaurants"],
          summary: "Crea una reserva pública",
          description: "Crea una reserva en estat PENDENT i llença el worker d'email (confirmació) i el worker d'expiració (2 min). No requereix autenticació.",
          parameters: [{ name: "restaurantId", in: "path", required: true, schema: { type: "integer" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateReservationBody" } } },
          },
          responses: {
            200: { description: "Reserva creada en estat PENDENT. Comprova el correu per confirmar-la." },
            400: { description: "Dades invàlides", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            409: { description: "La taula ja no està disponible", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // RESTAURANTS — RESERVES PER TOKEN (públic)
      // ════════════════════════════════════════════════════════════════════════
      "/restaurants/reservations/confirm/{token}": {
        get: {
          tags: ["Restaurants"],
          summary: "Confirma una reserva per token",
          description: "Canvia l'estat de la reserva de PENDENT a RESERVADA. Accessible des del link de l'email de confirmació. Redirigeix al frontend.",
          parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" }, description: "Token únic de la reserva" }],
          responses: {
            302: { description: "Redirecció al frontend (/reservar/confirmada o /reservar/expirada)" },
            404: { description: "Reserva no trobada" },
          },
        },
      },
      "/restaurants/reservations/cancel/{token}": {
        get: {
          tags: ["Restaurants"],
          summary: "Cancel·la una reserva per token",
          description: "Canvia l'estat de la reserva a CANCELADA. Accessible des del link de l'email. Redirigeix al frontend.",
          parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" }, description: "Token únic de la reserva" }],
          responses: {
            302: { description: "Redirecció al frontend (/reservar/cancelada o /reservar/expirada)" },
            404: { description: "Reserva no trobada" },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // RESTAURANTS — GESTIÓ DE RESERVES (personal)
      // ════════════════════════════════════════════════════════════════════════
      "/restaurants/reservationsForm/staff/{restaurantId}/createReservation": {
        post: {
          tags: ["Restaurants"],
          summary: "Crea una reserva des del personal",
          description: "Crea una reserva directa de sala sense flux d'email ni expiració. L'estat final el decideix el personal. Requereix rol RESPONSABLE o CAMBRER.",
          security: [{ cookieAuth: [] }],
          parameters: [{ name: "restaurantId", in: "path", required: true, schema: { type: "integer" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateReservationByStaffBody" } } },
          },
          responses: {
            200: { description: "Reserva creada correctament" },
            400: { description: "Dades invàlides o taula no disponible", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            409: { description: "Conflicte de reserva", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/restaurants/reservationsForm/{restaurantId}/reservations/{reservationId}": {
        patch: {
          tags: ["Restaurants"],
          summary: "Edita una reserva des del personal",
          description: "Actualitza contacte, taula, torn, data, hora, nombre de persones, estat i observacions. Requereix rol RESPONSABLE o CAMBRER.",
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: "restaurantId", in: "path", required: true, schema: { type: "integer" } },
            { name: "reservationId", in: "path", required: true, schema: { type: "integer" } },
          ],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateReservationByStaffBody" } } },
          },
          responses: {
            200: { description: "Reserva actualitzada correctament" },
            400: { description: "Dades invàlides", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            404: { description: "Reserva no trobada", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            409: { description: "Conflicte de reserva", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/restaurants/reservationsForm/{restaurantId}/reservations/{reservationId}/release": {
        patch: {
          tags: ["Restaurants"],
          summary: "Allibera una reserva",
          description: "Canvia l'estat de la reserva a LLIURE des de sala. Requereix rol RESPONSABLE o CAMBRER.",
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: "restaurantId", in: "path", required: true, schema: { type: "integer" } },
            { name: "reservationId", in: "path", required: true, schema: { type: "integer" } },
          ],
          responses: {
            200: { description: "Reserva alliberada correctament" },
            400: { description: "La reserva ja no és activa", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            404: { description: "Reserva no trobada", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // TAULES
      // ════════════════════════════════════════════════════════════════════════
      "/taules": {
        get: {
          tags: ["Taules"],
          summary: "Catàleg de tipus de taula",
          description: "Retorna els tipus de taula disponibles (capacitat, span de plànol, mínim de persones). Usat en el wizard de creació de restaurant. Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: "Llista de tipus de taula" },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // USUARIS
      // ════════════════════════════════════════════════════════════════════════
      "/usuaris": {
        get: {
          tags: ["Usuaris"],
          summary: "Usuaris disponibles per assignar",
          description: "Retorna els usuaris sense restaurant assignat per al wizard de creació. Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: "Llista d'usuaris assignables" },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/usuaris/allUsers": {
        get: {
          tags: ["Usuaris"],
          summary: "Tots els usuaris del sistema",
          description: "Retorna tots els usuaris amb el nom del restaurant assignat. Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: "Llista completa d'usuaris" },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/usuaris/me/restaurant": {
        get: {
          tags: ["Usuaris"],
          summary: "Restaurant assignat a l'usuari autenticat",
          description: "Retorna el restaurant assignat al RESPONSABLE o CAMBRER en sessió.",
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: "Dades del restaurant assignat" },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            404: { description: "Usuari no trobat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/usuaris/validate-email": {
        get: {
          tags: ["Usuaris"],
          summary: "Valida si un email ja existeix",
          security: [{ cookieAuth: [] }],
          parameters: [{ name: "email", in: "query", required: true, schema: { type: "string", format: "email" } }],
          responses: {
            200: { description: "Resultat de la validació" },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/usuaris/validate-username": {
        get: {
          tags: ["Usuaris"],
          summary: "Valida si un nom d'usuari ja existeix",
          security: [{ cookieAuth: [] }],
          parameters: [{ name: "username", in: "query", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Resultat de la validació" },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/usuaris/contactes": {
        post: {
          tags: ["Usuaris"],
          summary: "Envia un formulari de contacte",
          description: "Crea o reutilitza un Client per email i desa el missatge. No requereix autenticació.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/ContacteBody" } } },
          },
          responses: {
            201: { description: "Missatge de contacte enviat correctament" },
            400: { description: "Dades invàlides", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
        get: {
          tags: ["Usuaris"],
          summary: "Llista tots els formularis de contacte",
          description: "Retorna tots els missatges de contacte rebuts amb el correu del client. Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          responses: {
            200: { description: "Llista de missatges de contacte" },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/usuaris/contactes/{contactId}/read": {
        patch: {
          tags: ["Usuaris"],
          summary: "Marca un contacte com a llegit",
          description: "Actualitza l'estat del missatge a 'Llegit'. Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          parameters: [{ name: "contactId", in: "path", required: true, schema: { type: "integer" } }],
          responses: {
            200: { description: "Missatge marcat com a llegit" },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            404: { description: "Missatge no trobat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/usuaris/{userId}": {
        put: {
          tags: ["Usuaris"],
          summary: "Edita un usuari",
          description: "Actualitza les dades d'un usuari (edició en línia des de la taula de gestió). Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          parameters: [{ name: "userId", in: "path", required: true, schema: { type: "integer" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterBody" } } },
          },
          responses: {
            200: { description: "Usuari actualitzat correctament" },
            400: { description: "Dades invàlides", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            404: { description: "Usuari no trobat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            409: { description: "Email o nom d'usuari ja existeix", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
        delete: {
          tags: ["Usuaris"],
          summary: "Elimina un usuari",
          description: "Elimina un usuari del sistema. Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          parameters: [{ name: "userId", in: "path", required: true, schema: { type: "integer" } }],
          responses: {
            200: { description: "Usuari eliminat correctament" },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            404: { description: "Usuari no trobat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },

      // ════════════════════════════════════════════════════════════════════════
      // PLATS
      // ════════════════════════════════════════════════════════════════════════
      "/plats": {
        get: {
          tags: ["Plats"],
          summary: "Catàleg complet de plats",
          description: "Retorna tots els plats amb la seva categoria. No requereix autenticació.",
          responses: {
            200: { description: "Llista de plats" },
          },
        },
        post: {
          tags: ["Plats"],
          summary: "Crea un nou plat",
          description: "Alta d'un plat al catàleg global. Accepta `multipart/form-data` per pujar imatge. Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/PlatBody" },
                    { type: "object", properties: { image: { type: "string", format: "binary", description: "Imatge del plat (max 5MB)" } } },
                  ],
                },
              },
            },
          },
          responses: {
            201: { description: "Plat creat correctament" },
            400: { description: "Dades invàlides", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/plats/{id}": {
        put: {
          tags: ["Plats"],
          summary: "Actualitza un plat",
          description: "Actualitza les dades d'un plat existent. Accepta `multipart/form-data` per canviar la imatge. Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/UpdatePlatBody" },
                    { type: "object", properties: { image: { type: "string", format: "binary" } } },
                  ],
                },
              },
            },
          },
          responses: {
            200: { description: "Plat actualitzat correctament" },
            400: { description: "Dades invàlides", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            404: { description: "Plat no trobat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
        delete: {
          tags: ["Plats"],
          summary: "Elimina un plat",
          description: "Elimina un plat del catàleg global. Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          responses: {
            200: { description: "Plat eliminat correctament" },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            404: { description: "Plat no trobat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/plats/restaurants-menu": {
        get: {
          tags: ["Plats"],
          summary: "Disponibilitat de plats per restaurant",
          description: "Retorna la disponibilitat de tots els plats per a cada restaurant (menú públic). No requereix autenticació.",
          responses: {
            200: { description: "Disponibilitat de plats per restaurant" },
          },
        },
      },
      "/plats/restaurants/{restaurantId}/plats/{platId}/availability": {
        patch: {
          tags: ["Plats"],
          summary: "Actualitza disponibilitat d'un plat",
          description: "Activa o desactiva la disponibilitat d'un plat per a un restaurant concret. Requereix rol RESPONSABLE.",
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: "restaurantId", in: "path", required: true, schema: { type: "integer" } },
            { name: "platId", in: "path", required: true, schema: { type: "integer" } },
          ],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/UpdatePlatAvailabilityBody" } } },
          },
          responses: {
            200: { description: "Disponibilitat actualitzada correctament" },
            400: { description: "Dades invàlides", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/plats/categories": {
        get: {
          tags: ["Plats"],
          summary: "Totes les categories de plats",
          description: "Retorna el llistat de categories disponibles. No requereix autenticació.",
          responses: {
            200: { description: "Llista de categories" },
          },
        },
        post: {
          tags: ["Plats"],
          summary: "Crea una nova categoria",
          description: "Alta d'una categoria de plats. Requereix rol ADMIN.",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CategoriaBody" } } },
          },
          responses: {
            201: { description: "Categoria creada correctament" },
            400: { description: "Dades invàlides", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            401: { description: "No autenticat", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            403: { description: "Sense permisos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
