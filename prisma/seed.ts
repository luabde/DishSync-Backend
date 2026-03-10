import "dotenv/config";
import { prisma } from "../src/loaders/prisma.loader";

async function main() {
  console.log("🚀 Iniciando el seed...");
  
  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL no está definida");
    process.exit(1);
  }

  try {
    // Limpiar datos previos para evitar duplicados si es necesario
    // await prisma.taula.deleteMany(); 
    
    const result = await prisma.taula.createMany({
      data: [
        { num_persones: 2, span_fila: 1, span_columna: 1, min_persones_reserva: 1 },
        { num_persones: 4, span_fila: 1, span_columna: 2, min_persones_reserva: 2 },
        { num_persones: 6, span_fila: 2, span_columna: 2, min_persones_reserva: 4 },
        { num_persones: 8, span_fila: 2, span_columna: 3, min_persones_reserva: 6 },
        { num_persones: 10, span_fila: 2, span_columna: 4, min_persones_reserva: 8 },
        { num_persones: 12, span_fila: 3, span_columna: 4, min_persones_reserva: 10 },
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
