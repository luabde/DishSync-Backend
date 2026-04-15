import path from "path";
import { mkdir, unlink, writeFile } from "fs/promises";
import { PlatDTO, UpdatePlatDTO } from "../models/plats.model";
import { prisma } from "../loaders/prisma.loader";
import { AppError } from "../utils/AppError";

export class PlatService {
    private static async saveDishImage(imageFile: { originalname: string; buffer: Buffer }) {
        const extension = path.extname(imageFile.originalname) || ".jpg";
        const fileName = `dish-${Date.now()}${extension}`;
        const publicDir = path.join(process.cwd(), "public", "dishes");
        const filePath = path.join(publicDir, fileName);

        await mkdir(publicDir, { recursive: true });
        await writeFile(filePath, imageFile.buffer);

        return `/public/dishes/${fileName}`;
    }

    private static async removeLocalDishImage(imageUrl?: string | null) {
        if (!imageUrl || !imageUrl.startsWith("/public/dishes/")) return;

        const relativePath = imageUrl.replace(/^\/+/, "");
        const imagePath = path.join(process.cwd(), relativePath);

        try {
            await unlink(imagePath);
        } catch {
            // No bloqueamos update si la imagen local ya no existe.
        }
    }

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

    static async getPlats() {
        try {
            const plats = await prisma.plat.findMany({
                include: {
                    categoria: true, // Para que devuelva la categoria del plat
                },
            });
            return plats;
        } catch (error) {
            throw new AppError("Error al obtenir els plats", 500);
        }
    }

    static async deletePlat(id: number) {
        try {
            const plat = await prisma.plat.delete({
                where: { id },
            });
            return plat;
        } catch (error) {
            throw new AppError("Error al eliminar el plat", 500);
        }
    }

    static async updatePlat(
        id: number,
        data: UpdatePlatDTO,
        imageFile?: { originalname: string; buffer: Buffer }
    ) {
        const plat = await prisma.plat.findUnique({
            where: { id },
        });

        if (!plat) {
            throw new AppError("Plat no trobat", 404);
        }

        let nextUrl = data.url ?? plat.url ?? "";

        if (imageFile) {
            nextUrl = await this.saveDishImage(imageFile);
            await this.removeLocalDishImage(plat.url);
        } else if (!data.url && plat.url) {
            await this.removeLocalDishImage(plat.url);
            nextUrl = "";
        }

        try {
            return await prisma.plat.update({
                where: { id },
                data: {
                    nom: data.nom,
                    descripcio: data.descripcio,
                    id_categoria: data.id_categoria,
                    url: nextUrl,
                },
                include: {
                    categoria: true,
                },
            });
        } catch (error) {
            throw new AppError("Error al actualizar el plat", 500);
        }
    }
}