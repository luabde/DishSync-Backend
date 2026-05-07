import "dotenv/config";
import bcrypt from "bcrypt";
import { RolUsuari } from "../generated/prisma/client";
import { prisma } from "../src/loaders/prisma.loader";

async function main() {
  console.log("🚀 Iniciando el seed...");
  
  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL no está definida");
    process.exit(1);
  }

  try {
    const adminPasswordHash = await bcrypt.hash("AdminDishSync2026!", 10);

    await prisma.usuari.upsert({
      where: { email: "admin@gmail.com" },
      update: {
        password: adminPasswordHash,
        rol: RolUsuari.ADMIN,
      },
      create: {
        nom: "Admin",
        cognoms: "DishSync",
        email: "admin@gmail.com",
        password: adminPasswordHash,
        rol: RolUsuari.ADMIN,
      },
    });

    console.log("Usuario admin creado/actualizado correctamente.");

    const restaurantsSeed = [
      {
        nom: "El Castell Barcelona Centro",
        direccio: "Plaça de Catalunya, Barcelona",
        lat: 41.3870,
        lng: 2.1701,
        horaris: "12:00-16:00, 20:00-23:30",
        telefon: "933000111",
        url: "public/restaurants/el-castell-barcelona-centro.jpg",
        descripcio: "Restaurant al centre de Barcelona.",
        estat: "ACTIU" as const,
      },
      {
        nom: "El Castell Gràcia",
        direccio: "Carrer Gran de Gràcia, Barcelona",
        lat: 41.4017,
        lng: 2.1530,
        horaris: "13:00-16:00, 20:00-23:00",
        telefon: "933000222",
        url: "public/restaurants/el-castell-gracia.jpg",
        descripcio: "Restaurant al barri de Gràcia.",
        estat: "ACTIU" as const,
      },
      {
        nom: "El Castell València",
        direccio: "Plaça de l'Ajuntament, València",
        lat: 39.4699,
        lng: -0.3763,
        horaris: "13:00-16:30, 20:30-23:30",
        telefon: "963000333",
        url: "public/restaurants/el-castell-valencia.jpg",
        descripcio: "Restaurant al centre de València.",
        estat: "ACTIU" as const,
      },
    ];

    for (const restaurant of restaurantsSeed) {
      const existingRestaurant = await prisma.restaurant.findFirst({
        where: { nom: restaurant.nom },
        select: { id: true },
      });

      if (existingRestaurant) {
        await prisma.restaurant.update({
          where: { id: existingRestaurant.id },
          data: restaurant,
        });
      } else {
        await prisma.restaurant.create({
          data: restaurant,
        });
      }
    }

    console.log(`Restaurantes creados/actualizados correctamente: ${restaurantsSeed.length}.`);

    const categoriesSeed = [
      {
        nom: "Entrants",
        descripcio: "Plats per començar i compartir.",
      },
      {
        nom: "Principals",
        descripcio: "Plats principals del menú.",
      },
      {
        nom: "Postres",
        descripcio: "Selecció de postres casolanes.",
      },
      {
        nom: "Begudes",
        descripcio: "Refrescos, sucs i aigua.",
      },
    ];

    for (const category of categoriesSeed) {
      const existingCategory = await prisma.categoria.findFirst({
        where: { nom: category.nom },
      });

      if (existingCategory) {
        await prisma.categoria.update({
          where: { id: existingCategory.id },
          data: {
            descripcio: category.descripcio,
          },
        });
      } else {
        await prisma.categoria.create({
          data: category,
        });
      }
    }

    const categories = await prisma.categoria.findMany({
      where: {
        nom: {
          in: categoriesSeed.map((category) => category.nom),
        },
      },
    });

    const categoryIdByName = new Map(
      categories.map((category) => [category.nom, category.id]),
    );

    const dishesSeed = [
      {
        nom: "Patates Braves",
        descripcio: "Patates cruixents amb salsa brava i allioli.",
        preu: "6.50",
        categoria: "Entrants",
        imageName: "patates-braves.png",
      },
      {
        nom: "Croquetes de Pernil",
        descripcio: "Croquetes casolanes de pernil ibèric.",
        preu: "7.50",
        categoria: "Entrants",
        imageName: "croquetes-pernil.png",
      },
      {
        nom: "Amanida de Cabra",
        descripcio: "Mesclum amb formatge de cabra, nous i mel.",
        preu: "9.20",
        categoria: "Entrants",
        imageName: "amanida-cabra.png",
      },
      {
        nom: "Paella de Marisc",
        descripcio: "Arròs melós amb marisc fresc.",
        preu: "16.90",
        categoria: "Principals",
        imageName: "paella-marisc.png",
      },
      {
        nom: "Entrecot a la Brasa",
        descripcio: "Entrecot de vedella amb guarnició de temporada.",
        preu: "21.00",
        categoria: "Principals",
        imageName: "entrecot-brasa.png",
      },
      {
        nom: "Salmó al Forn",
        descripcio: "Salmó amb verdures rostides i salsa cítrica.",
        preu: "18.50",
        categoria: "Principals",
        imageName: "salmo-forn.png",
      },
      {
        nom: "Cheesecake",
        descripcio: "Pastís de formatge cremós amb fruits vermells.",
        preu: "5.80",
        categoria: "Postres",
        imageName: "cheesecake.png",
      },
      {
        nom: "Coulant de Xocolata",
        descripcio: "Bizcocho calent de xocolata amb interior líquid.",
        preu: "6.20",
        categoria: "Postres",
        imageName: "coulant-xocolata.png",
      },
      {
        nom: "Aigua Mineral",
        descripcio: "Ampolla d'aigua mineral de 50cl.",
        preu: "2.20",
        categoria: "Begudes",
        imageName: "aigua-mineral.png",
      },
      {
        nom: "Llimonada Casolana",
        descripcio: "Llimonada natural feta al moment.",
        preu: "3.90",
        categoria: "Begudes",
        imageName: "llimonada-casolana.png",
      },
      {
        nom: "Nachos Complets",
        descripcio: "Nachos amb cheddar, guacamole i pico de gallo.",
        preu: "8.40",
        categoria: "Entrants",
        imageName: "nachos-complets.png",
      },
      {
        nom: "Calamars a l'Andalusa",
        descripcio: "Anelles de calamar fregides amb llimona.",
        preu: "10.10",
        categoria: "Entrants",
        imageName: "calamars-andalusa.png",
      },
      {
        nom: "Musclos al Vapor",
        descripcio: "Musclos frescos cuits al vapor amb llorer.",
        preu: "9.80",
        categoria: "Entrants",
        imageName: "musclos-vapor.png",
      },
      {
        nom: "Burrata amb Tomaca",
        descripcio: "Burrata cremosa amb tomaca confitada i alfabrega.",
        preu: "11.20",
        categoria: "Entrants",
        imageName: "burrata-tomaca.png",
      },
      {
        nom: "Risotto de Bolets",
        descripcio: "Arròs cremós amb bolets de temporada i parmesa.",
        preu: "14.50",
        categoria: "Principals",
        imageName: "risotto-bolets.png",
      },
      {
        nom: "Hamburguesa Gourmet",
        descripcio: "Vedella 180g, formatge curat i ceba caramelitzada.",
        preu: "13.90",
        categoria: "Principals",
        imageName: "hamburguesa-gourmet.png",
      },
      {
        nom: "Pizza Quatre Formatges",
        descripcio: "Massa fina amb mozzarella, gorgonzola, brie i parmesa.",
        preu: "12.80",
        categoria: "Principals",
        imageName: "pizza-quatre-formatges.png",
      },
      {
        nom: "Pollastre Teriyaki",
        descripcio: "Pollastre saltat amb salsa teriyaki i sèsam.",
        preu: "12.40",
        categoria: "Principals",
        imageName: "pollastre-teriyaki.png",
      },
      {
        nom: "Bacalla Confitat",
        descripcio: "Llom de bacalla amb parmentier i oli d'herbes.",
        preu: "17.60",
        categoria: "Principals",
        imageName: "bacalla-confitat.png",
      },
      {
        nom: "Raviolis de Ricotta i Espinacs",
        descripcio: "Pasta fresca farcida de ricotta i espinacs amb crema de parmesa.",
        preu: "13.20",
        categoria: "Principals",
        imageName: "raviolis-ricotta-espinacs.png",
      },
      {
        nom: "Tiramisu Casola",
        descripcio: "Capes de melindro, cafe i crema de mascarpone.",
        preu: "5.90",
        categoria: "Postres",
        imageName: "tiramisu-casola.png",
      },
      {
        nom: "Brownie amb Gelat",
        descripcio: "Brownie de xocolata amb bola de vainilla.",
        preu: "6.40",
        categoria: "Postres",
        imageName: "brownie-gelat.png",
      },
      {
        nom: "Crema Catalana",
        descripcio: "Postra tradicional amb sucre cremat.",
        preu: "5.30",
        categoria: "Postres",
        imageName: "crema-catalana.png",
      },
      {
        nom: "Sorbet de Llimona",
        descripcio: "Sorbet refrescant de llimona natural.",
        preu: "4.80",
        categoria: "Postres",
        imageName: "sorbet-llimona.png",
      },
      {
        nom: "Coulant Blanc",
        descripcio: "Coulant de xocolata blanca amb fruita vermella.",
        preu: "6.60",
        categoria: "Postres",
        imageName: "coulant-blanc.png",
      },
      {
        nom: "Coca-Cola",
        descripcio: "Refresc de cola 33cl.",
        preu: "2.80",
        categoria: "Begudes",
        imageName: "coca-cola.png",
      },
      {
        nom: "Coca-Cola Zero",
        descripcio: "Refresc de cola zero sucre 33cl.",
        preu: "2.80",
        categoria: "Begudes",
        imageName: "coca-cola-zero.png",
      },
      {
        nom: "Fanta Taronja",
        descripcio: "Refresc de taronja 33cl.",
        preu: "2.80",
        categoria: "Begudes",
        imageName: "fanta-taronja.png",
      },
      {
        nom: "Fanta Llimona",
        descripcio: "Refresc de llimona 33cl.",
        preu: "2.80",
        categoria: "Begudes",
        imageName: "fanta-llimona.png",
      },
      {
        nom: "Sprite",
        descripcio: "Refresc de llimona i llima 33cl.",
        preu: "2.80",
        categoria: "Begudes",
        imageName: "sprite.png",
      },
      {
        nom: "Nestea",
        descripcio: "Te fred sabor llimona 33cl.",
        preu: "2.90",
        categoria: "Begudes",
        imageName: "nestea.png",
      },
      {
        nom: "Aquarius Llimona",
        descripcio: "Beguda isotònica sabor llimona 33cl.",
        preu: "2.90",
        categoria: "Begudes",
        imageName: "aquarius-llimona.png",
      },
      {
        nom: "Aigua amb Gas",
        descripcio: "Ampolla d'aigua amb gas 50cl.",
        preu: "2.40",
        categoria: "Begudes",
        imageName: "aigua-amb-gas.png",
      },
      {
        nom: "Aigua 1L",
        descripcio: "Ampolla d'aigua mineral d'1 litre.",
        preu: "3.20",
        categoria: "Begudes",
        imageName: "aigua-1l.png",
      },
      {
        nom: "Suc de Taronja",
        descripcio: "Suc natural de taronja acabat d'espremer.",
        preu: "3.70",
        categoria: "Begudes",
        imageName: "suc-taronja.png",
      },
      {
        nom: "Cervesa Artesana",
        descripcio: "Cervesa artesana rossa 33cl.",
        preu: "3.90",
        categoria: "Begudes",
        imageName: "cervesa-artesana.png",
      },
      {
        nom: "Copa de Vi Negre",
        descripcio: "Copa de vi negre de la casa.",
        preu: "4.20",
        categoria: "Begudes",
        imageName: "copa-vi-negre.png",
      },
      {
        nom: "Copa de Vi Blanc",
        descripcio: "Copa de vi blanc de la casa.",
        preu: "4.20",
        categoria: "Begudes",
        imageName: "copa-vi-blanc.png",
      },
    ];

    for (const dish of dishesSeed) {
      const categoryId = categoryIdByName.get(dish.categoria);
      if (!categoryId) continue;

      const existingDish = await prisma.plat.findFirst({
        where: {
          nom: dish.nom,
          id_categoria: categoryId,
        },
      });

      if (existingDish) {
        await prisma.plat.update({
          where: { id: existingDish.id },
          data: {
            descripcio: dish.descripcio,
            preu: dish.preu,
            url: `public/dishes/${dish.imageName}`,
          },
        });
      } else {
        await prisma.plat.create({
          data: {
            id_categoria: categoryId,
            nom: dish.nom,
            descripcio: dish.descripcio,
            preu: dish.preu,
            url: `public/dishes/${dish.imageName}`,
          },
        });
      }
    }

    console.log(`Plats creados/actualizados correctamente: ${dishesSeed.length}.`);

    const clientsSeed = [
      {
        nom: "Marta",
        cognoms: "Serra Puig",
        email: "marta.serra@gmail.com",
        telefon: "600111222",
      },
      {
        nom: "Jordi",
        cognoms: "Vila Costa",
        email: "jordi.vila@gmail.com",
        telefon: "600333444",
      },
      {
        nom: "Laia",
        cognoms: "Roca Soler",
        email: "laia.roca@gmail.com",
        telefon: "600555666",
      },
    ];

    for (const client of clientsSeed) {
      await prisma.client.upsert({
        where: { email: client.email },
        update: {
          nom: client.nom,
          cognoms: client.cognoms,
          telefon: client.telefon,
        },
        create: client,
      });
    }

    const clients = await prisma.client.findMany({
      where: {
        email: {
          in: clientsSeed.map((client) => client.email),
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    const clientIdByEmail = new Map(
      clients.map((client) => [client.email, client.id]),
    );

    const contactsSeed = [
      {
        clientEmail: "marta.serra@gmail.com",
        missatge: "Hola! Voldria saber si teniu opcions sense gluten al menú.",
        estat: "Pendent",
      },
      {
        clientEmail: "jordi.vila@gmail.com",
        missatge: "Bon dia, he tingut un problema amb una reserva i necessito ajuda.",
        estat: "Llegit",
      },
      {
        clientEmail: "laia.roca@gmail.com",
        missatge: "Es pot reservar taula a la terrassa per aquest dissabte?",
        estat: "Pendent",
      },
      {
        clientEmail: "marta.serra@gmail.com",
        missatge: "Teniu menú infantil disponible cada dia?",
        estat: "Llegit",
      },
    ];

    for (const contact of contactsSeed) {
      const clientId = clientIdByEmail.get(contact.clientEmail);
      if (!clientId) continue;

      const existingContact = await prisma.contacteClient.findFirst({
        where: {
          id_client: clientId,
          missatge: contact.missatge,
        },
      });

      if (existingContact) {
        await prisma.contacteClient.update({
          where: { id: existingContact.id },
          data: { estat: contact.estat },
        });
      } else {
        await prisma.contacteClient.create({
          data: {
            id_client: clientId,
            missatge: contact.missatge,
            estat: contact.estat,
          },
        });
      }
    }

    console.log(`Contactes creados/actualizados correctamente: ${contactsSeed.length}.`);

    const allSeedRestaurants = await prisma.restaurant.findMany({
      where: { nom: { in: restaurantsSeed.map((restaurant) => restaurant.nom) } },
      select: { id: true, nom: true },
    });

    // Un cambrer y un responsable por restaurante.
    for (const restaurant of allSeedRestaurants) {
      const slug = restaurant.nom
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const cambrerHash = await bcrypt.hash("Cambrer2026!", 10);
      const responsableHash = await bcrypt.hash("Responsable2026!", 10);

      await prisma.usuari.upsert({
        where: { email: `cambrer.${slug}@dishsync.com` },
        update: {
          nom: "Cambrer",
          cognoms: restaurant.nom,
          password: cambrerHash,
          rol: RolUsuari.CAMBRER,
          id_restaurant: restaurant.id,
        },
        create: {
          nom: "Cambrer",
          cognoms: restaurant.nom,
          email: `cambrer.${slug}@dishsync.com`,
          password: cambrerHash,
          rol: RolUsuari.CAMBRER,
          id_restaurant: restaurant.id,
        },
      });

      await prisma.usuari.upsert({
        where: { email: `responsable.${slug}@dishsync.com` },
        update: {
          nom: "Responsable",
          cognoms: restaurant.nom,
          password: responsableHash,
          rol: RolUsuari.RESPONSABLE,
          id_restaurant: restaurant.id,
        },
        create: {
          nom: "Responsable",
          cognoms: restaurant.nom,
          email: `responsable.${slug}@dishsync.com`,
          password: responsableHash,
          rol: RolUsuari.RESPONSABLE,
          id_restaurant: restaurant.id,
        },
      });
    }

    const result = await prisma.taula.createMany({
      data: [
        { num_persones: 2, span_fila: 1, span_columna: 1, min_persones_reserva: 1 },
        { num_persones: 4, span_fila: 1, span_columna: 1, min_persones_reserva: 2 },
        { num_persones: 6, span_fila: 1, span_columna: 2, min_persones_reserva: 4 },
        { num_persones: 8, span_fila: 1, span_columna: 2, min_persones_reserva: 6 },
        { num_persones: 10, span_fila: 1, span_columna: 3, min_persones_reserva: 8 },
        { num_persones: 12, span_fila: 1, span_columna: 3, min_persones_reserva: 10 },
      ],
      skipDuplicates: true,
    });

    console.log(`Mesas creadas correctamente: ${result.count} registros insertados.`);

    const tableTypes = await prisma.taula.findMany({
      where: { num_persones: { in: [2, 4, 6, 8, 10, 12] } },
      select: { id: true, num_persones: true },
    });
    const tableTypeIdBySeats = new Map(tableTypes.map((tableType) => [tableType.num_persones, tableType.id]));

    // Todos los platos quedan asignados a todos los restaurantes.
    const allDishes = await prisma.plat.findMany({ select: { id: true } });
    for (const restaurant of allSeedRestaurants) {
      for (const dish of allDishes) {
        const existingDishRelation = await prisma.platRestaurant.findFirst({
          where: { id_restaurant: restaurant.id, id_plat: dish.id },
          select: { id: true },
        });

        if (!existingDishRelation) {
          await prisma.platRestaurant.create({
            data: {
              id_restaurant: restaurant.id,
              id_plat: dish.id,
              disponibilitat: true,
            },
          });
        }
      }
    }

    // Zonas, turnos (dinar/sopar) y horarios por restaurante.
    const zonesByRestaurant: Record<string, Array<{ nom: string; capacitat_max: number }>> = {
      "El Castell Barcelona Centro": [
        { nom: "Terrassa", capacitat_max: 30 },
        { nom: "Sala Principal", capacitat_max: 60 },
        { nom: "Privada", capacitat_max: 20 },
      ],
      "El Castell Gràcia": [
        { nom: "Interior", capacitat_max: 40 },
        { nom: "Altell", capacitat_max: 26 },
        { nom: "Terrassa", capacitat_max: 24 },
      ],
      "El Castell València": [
        { nom: "Sala Riu", capacitat_max: 42 },
        { nom: "Sala Jardí", capacitat_max: 30 },
        { nom: "Privat", capacitat_max: 20 },
      ],
    };

    const tablePlacementsByRestaurant: Record<
      string,
      Array<{ zona: string; num_taula: number; fila: number; columna: number; num_persones: number }>
    > = {
      "El Castell Barcelona Centro": [
        { zona: "Terrassa", num_taula: 1, fila: 1, columna: 1, num_persones: 2 },
        { zona: "Terrassa", num_taula: 2, fila: 1, columna: 2, num_persones: 4 },
        { zona: "Terrassa", num_taula: 3, fila: 2, columna: 1, num_persones: 4 },
        { zona: "Sala Principal", num_taula: 4, fila: 1, columna: 1, num_persones: 6 },
        { zona: "Sala Principal", num_taula: 5, fila: 1, columna: 3, num_persones: 8 },
        { zona: "Sala Principal", num_taula: 6, fila: 2, columna: 1, num_persones: 10 },
        { zona: "Privada", num_taula: 7, fila: 1, columna: 1, num_persones: 8 },
      ],
      "El Castell Gràcia": [
        { zona: "Interior", num_taula: 1, fila: 1, columna: 1, num_persones: 2 },
        { zona: "Interior", num_taula: 2, fila: 1, columna: 2, num_persones: 4 },
        { zona: "Interior", num_taula: 3, fila: 2, columna: 1, num_persones: 6 },
        { zona: "Altell", num_taula: 4, fila: 1, columna: 1, num_persones: 4 },
        { zona: "Altell", num_taula: 5, fila: 1, columna: 2, num_persones: 8 },
        { zona: "Terrassa", num_taula: 6, fila: 1, columna: 1, num_persones: 2 },
        { zona: "Terrassa", num_taula: 7, fila: 2, columna: 1, num_persones: 4 },
      ],
      "El Castell València": [
        { zona: "Sala Riu", num_taula: 1, fila: 1, columna: 1, num_persones: 4 },
        { zona: "Sala Riu", num_taula: 2, fila: 1, columna: 3, num_persones: 6 },
        { zona: "Sala Riu", num_taula: 3, fila: 2, columna: 1, num_persones: 8 },
        { zona: "Sala Jardí", num_taula: 4, fila: 1, columna: 1, num_persones: 4 },
        { zona: "Sala Jardí", num_taula: 5, fila: 1, columna: 2, num_persones: 6 },
        { zona: "Privat", num_taula: 6, fila: 1, columna: 1, num_persones: 10 },
      ],
    };

    const weekDays = [1, 2, 3, 4, 5, 6, 7];
    const dinarHours = ["13:00", "13:30", "14:00", "14:30", "15:00"];
    const soparHours = ["20:00", "20:30", "21:00", "21:30", "22:00"];

    for (const restaurant of allSeedRestaurants) {
      const restaurantZones = zonesByRestaurant[restaurant.nom] ?? [];
      const zoneIdByName = new Map<string, number>();

      for (const zone of restaurantZones) {
        const existingZone = await prisma.zona.findFirst({
          where: { id_restaurant: restaurant.id, nom: zone.nom },
          select: { id: true },
        });

        if (existingZone) {
          await prisma.zona.update({
            where: { id: existingZone.id },
            data: { capacitat_max: zone.capacitat_max },
          });
          zoneIdByName.set(zone.nom, existingZone.id);
        } else {
          const createdZone = await prisma.zona.create({
            data: { id_restaurant: restaurant.id, nom: zone.nom, capacitat_max: zone.capacitat_max },
            select: { id: true },
          });
          zoneIdByName.set(zone.nom, createdZone.id);
        }
      }

      const restaurantTables = tablePlacementsByRestaurant[restaurant.nom] ?? [];
      for (const table of restaurantTables) {
        const zoneId = zoneIdByName.get(table.zona);
        const tableTypeId = tableTypeIdBySeats.get(table.num_persones);
        if (!zoneId || !tableTypeId) continue;

        const existingPlacement = await prisma.taulaRestaurant.findFirst({
          where: { id_restaurant: restaurant.id, num_taula: table.num_taula },
          select: { id: true },
        });

        if (existingPlacement) {
          await prisma.taulaRestaurant.update({
            where: { id: existingPlacement.id },
            data: {
              id_zona: zoneId,
              id_taula: tableTypeId,
              fila: table.fila,
              columna: table.columna,
            },
          });
        } else {
          await prisma.taulaRestaurant.create({
            data: {
              id_restaurant: restaurant.id,
              id_zona: zoneId,
              id_taula: tableTypeId,
              num_taula: table.num_taula,
              fila: table.fila,
              columna: table.columna,
            },
          });
        }
      }

      // Turno DINAR
      let dinarTorn = await prisma.torn.findFirst({
        where: { id_restaurant: restaurant.id, nom: "Dinar" },
        select: { id: true },
      });
      if (!dinarTorn) {
        dinarTorn = await prisma.torn.create({
          data: { id_restaurant: restaurant.id, nom: "Dinar", hora_inici: "13:00", hora_fi: "16:00" },
          select: { id: true },
        });
      } else {
        await prisma.torn.update({
          where: { id: dinarTorn.id },
          data: { hora_inici: "13:00", hora_fi: "16:00" },
        });
      }

      // Turno SOPAR
      let soparTorn = await prisma.torn.findFirst({
        where: { id_restaurant: restaurant.id, nom: "Sopar" },
        select: { id: true },
      });
      if (!soparTorn) {
        soparTorn = await prisma.torn.create({
          data: { id_restaurant: restaurant.id, nom: "Sopar", hora_inici: "20:00", hora_fi: "23:30" },
          select: { id: true },
        });
      } else {
        await prisma.torn.update({
          where: { id: soparTorn.id },
          data: { hora_inici: "20:00", hora_fi: "23:30" },
        });
      }

      for (const day of weekDays) {
        for (const hour of dinarHours) {
          const exists = await prisma.horarisTorn.findFirst({
            where: { id_torn: dinarTorn.id, dia_setmana: day, hora: hour },
            select: { id: true },
          });
          if (!exists) {
            await prisma.horarisTorn.create({
              data: { id_torn: dinarTorn.id, dia_setmana: day, hora: hour },
            });
          }
        }
      }

      for (const day of weekDays) {
        for (const hour of soparHours) {
          const exists = await prisma.horarisTorn.findFirst({
            where: { id_torn: soparTorn.id, dia_setmana: day, hora: hour },
            select: { id: true },
          });
          if (!exists) {
            await prisma.horarisTorn.create({
              data: { id_torn: soparTorn.id, dia_setmana: day, hora: hour },
            });
          }
        }
      }
    }

    console.log("Seed de relaciones de restaurante completado (usuarios, zonas, turnos, horarios, mesas y platos).");
  } catch (error) {
    console.error("Error durante el seed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
