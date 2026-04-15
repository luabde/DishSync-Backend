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
    const adminPasswordHash = await bcrypt.hash("123456", 10);

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
        imageName: "patates-braves.jpg",
      },
      {
        nom: "Croquetes de Pernil",
        descripcio: "Croquetes casolanes de pernil ibèric.",
        preu: "7.50",
        categoria: "Entrants",
        imageName: "croquetes-pernil.jpg",
      },
      {
        nom: "Amanida de Cabra",
        descripcio: "Mesclum amb formatge de cabra, nous i mel.",
        preu: "9.20",
        categoria: "Entrants",
        imageName: "amanida-cabra.jpg",
      },
      {
        nom: "Paella de Marisc",
        descripcio: "Arròs melós amb marisc fresc.",
        preu: "16.90",
        categoria: "Principals",
        imageName: "paella-marisc.jpg",
      },
      {
        nom: "Entrecot a la Brasa",
        descripcio: "Entrecot de vedella amb guarnició de temporada.",
        preu: "21.00",
        categoria: "Principals",
        imageName: "entrecot-brasa.jpg",
      },
      {
        nom: "Salmó al Forn",
        descripcio: "Salmó amb verdures rostides i salsa cítrica.",
        preu: "18.50",
        categoria: "Principals",
        imageName: "salmo-forn.jpg",
      },
      {
        nom: "Cheesecake",
        descripcio: "Pastís de formatge cremós amb fruits vermells.",
        preu: "5.80",
        categoria: "Postres",
        imageName: "cheesecake.jpg",
      },
      {
        nom: "Coulant de Xocolata",
        descripcio: "Bizcocho calent de xocolata amb interior líquid.",
        preu: "6.20",
        categoria: "Postres",
        imageName: "coulant-xocolata.jpg",
      },
      {
        nom: "Aigua Mineral",
        descripcio: "Ampolla d'aigua mineral de 50cl.",
        preu: "2.20",
        categoria: "Begudes",
        imageName: "aigua-mineral.jpg",
      },
      {
        nom: "Llimonada Casolana",
        descripcio: "Llimonada natural feta al moment.",
        preu: "3.90",
        categoria: "Begudes",
        imageName: "llimonada-casolana.jpg",
      },
      {
        nom: "Nachos Complets",
        descripcio: "Nachos amb cheddar, guacamole i pico de gallo.",
        preu: "8.40",
        categoria: "Entrants",
        imageName: "nachos-complets.jpg",
      },
      {
        nom: "Calamars a l'Andalusa",
        descripcio: "Anelles de calamar fregides amb llimona.",
        preu: "10.10",
        categoria: "Entrants",
        imageName: "calamars-andalusa.jpg",
      },
      {
        nom: "Musclos al Vapor",
        descripcio: "Musclos frescos cuits al vapor amb llorer.",
        preu: "9.80",
        categoria: "Entrants",
        imageName: "musclos-vapor.jpg",
      },
      {
        nom: "Burrata amb Tomaca",
        descripcio: "Burrata cremosa amb tomaca confitada i alfabrega.",
        preu: "11.20",
        categoria: "Entrants",
        imageName: "burrata-tomaca.jpg",
      },
      {
        nom: "Risotto de Bolets",
        descripcio: "Arròs cremós amb bolets de temporada i parmesa.",
        preu: "14.50",
        categoria: "Principals",
        imageName: "risotto-bolets.jpg",
      },
      {
        nom: "Hamburguesa Gourmet",
        descripcio: "Vedella 180g, formatge curat i ceba caramelitzada.",
        preu: "13.90",
        categoria: "Principals",
        imageName: "hamburguesa-gourmet.jpg",
      },
      {
        nom: "Pizza Quatre Formatges",
        descripcio: "Massa fina amb mozzarella, gorgonzola, brie i parmesa.",
        preu: "12.80",
        categoria: "Principals",
        imageName: "pizza-quatre-formatges.jpg",
      },
      {
        nom: "Pollastre Teriyaki",
        descripcio: "Pollastre saltat amb salsa teriyaki i sèsam.",
        preu: "12.40",
        categoria: "Principals",
        imageName: "pollastre-teriyaki.jpg",
      },
      {
        nom: "Bacalla Confitat",
        descripcio: "Llom de bacalla amb parmentier i oli d'herbes.",
        preu: "17.60",
        categoria: "Principals",
        imageName: "bacalla-confitat.jpg",
      },
      {
        nom: "Tiramisu Casola",
        descripcio: "Capes de melindro, cafe i crema de mascarpone.",
        preu: "5.90",
        categoria: "Postres",
        imageName: "tiramisu-casola.jpg",
      },
      {
        nom: "Brownie amb Gelat",
        descripcio: "Brownie de xocolata amb bola de vainilla.",
        preu: "6.40",
        categoria: "Postres",
        imageName: "brownie-gelat.jpg",
      },
      {
        nom: "Crema Catalana",
        descripcio: "Postra tradicional amb sucre cremat.",
        preu: "5.30",
        categoria: "Postres",
        imageName: "crema-catalana.jpg",
      },
      {
        nom: "Sorbet de Llimona",
        descripcio: "Sorbet refrescant de llimona natural.",
        preu: "4.80",
        categoria: "Postres",
        imageName: "sorbet-llimona.jpg",
      },
      {
        nom: "Coulant Blanc",
        descripcio: "Coulant de xocolata blanca amb fruita vermella.",
        preu: "6.60",
        categoria: "Postres",
        imageName: "coulant-blanc.jpg",
      },
      {
        nom: "Coca-Cola",
        descripcio: "Refresc de cola 33cl.",
        preu: "2.80",
        categoria: "Begudes",
        imageName: "coca-cola.jpg",
      },
      {
        nom: "Coca-Cola Zero",
        descripcio: "Refresc de cola zero sucre 33cl.",
        preu: "2.80",
        categoria: "Begudes",
        imageName: "coca-cola-zero.jpg",
      },
      {
        nom: "Fanta Taronja",
        descripcio: "Refresc de taronja 33cl.",
        preu: "2.80",
        categoria: "Begudes",
        imageName: "fanta-taronja.jpg",
      },
      {
        nom: "Fanta Llimona",
        descripcio: "Refresc de llimona 33cl.",
        preu: "2.80",
        categoria: "Begudes",
        imageName: "fanta-llimona.jpg",
      },
      {
        nom: "Sprite",
        descripcio: "Refresc de llimona i llima 33cl.",
        preu: "2.80",
        categoria: "Begudes",
        imageName: "sprite.jpg",
      },
      {
        nom: "Nestea",
        descripcio: "Te fred sabor llimona 33cl.",
        preu: "2.90",
        categoria: "Begudes",
        imageName: "nestea.jpg",
      },
      {
        nom: "Aquarius Llimona",
        descripcio: "Beguda isotònica sabor llimona 33cl.",
        preu: "2.90",
        categoria: "Begudes",
        imageName: "aquarius-llimona.jpg",
      },
      {
        nom: "Aigua amb Gas",
        descripcio: "Ampolla d'aigua amb gas 50cl.",
        preu: "2.40",
        categoria: "Begudes",
        imageName: "aigua-amb-gas.jpg",
      },
      {
        nom: "Aigua 1L",
        descripcio: "Ampolla d'aigua mineral d'1 litre.",
        preu: "3.20",
        categoria: "Begudes",
        imageName: "aigua-1l.jpg",
      },
      {
        nom: "Suc de Taronja",
        descripcio: "Suc natural de taronja acabat d'espremer.",
        preu: "3.70",
        categoria: "Begudes",
        imageName: "suc-taronja.jpg",
      },
      {
        nom: "Cervesa Artesana",
        descripcio: "Cervesa artesana rossa 33cl.",
        preu: "3.90",
        categoria: "Begudes",
        imageName: "cervesa-artesana.jpg",
      },
      {
        nom: "Copa de Vi Negre",
        descripcio: "Copa de vi negre de la casa.",
        preu: "4.20",
        categoria: "Begudes",
        imageName: "copa-vi-negre.jpg",
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

    // Limpiar datos previos para evitar duplicados si es necesario
    // await prisma.taula.deleteMany(); 
    
    const result = await prisma.taula.createMany({
      data: [
        { num_persones: 2, span_fila: 1, span_columna: 1, min_persones_reserva: 1 },
        { num_persones: 4, span_fila: 1, span_columna: 1, min_persones_reserva: 2 },
        { num_persones: 6, span_fila: 1, span_columna: 2, min_persones_reserva: 4 },
        { num_persones: 8, span_fila: 1, span_columna: 2, min_persones_reserva: 6 },
        { num_persones: 10, span_fila: 1, span_columna: 3, min_persones_reserva: 8 },
        { num_persones: 12, span_fila: 1, span_columna: 3, min_persones_reserva: 10 },
      ],
      skipDuplicates: true, // Evita errores si ya existen registros idénticos
    });

    console.log(`Mesas creadas correctamente: ${result.count} registros insertados.`);
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
