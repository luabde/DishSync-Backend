import { PlatDTO } from "../models/plats.model";
import { prisma } from "../loaders/prisma.loader";
import { AppError } from "../utils/AppError";

export class PlatService {
    static async createPlat(data: PlatDTO) {
        try {
            const plat = await prisma.plat.create({
                data: {
                    nom: data.nom,
                    descripcio: data.descripcio,
                    preu: data.preu,
                    url: data.url,
                    id_categoria: data.id_categoria
                }
            });
            return plat;
        } catch (error) {
            throw new AppError("Error al crear el plat", 500);
        }
    }
}