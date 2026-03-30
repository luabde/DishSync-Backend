import { prisma } from "../loaders/prisma.loader";

export class TaulesService {
  /**
   * Devuelve el catálogo de tipos de mesa definido en BD (tabla TAULES).
   * Esta información se usa en frontend para construir el "mobiliari"
   * de forma dinámica (num_persones + spans de grid).
   */
  static async getTableTypes() {
    return prisma.taula.findMany({
      select: {
        id: true,
        num_persones: true,
        span_fila: true,
        span_columna: true,
        min_persones_reserva: true,
      },
      orderBy: { num_persones: "asc" },
    });
  }
}
