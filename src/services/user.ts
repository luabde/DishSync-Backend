import { UserDTO } from "../models/user";
import { prisma } from "../loaders/prisma.loader";
import { Prisma } from "../../generated/prisma/client";
import { AppError } from "../utils/AppError";

export class UserService {
    static async createUser(data: UserDTO) {
        try {
            // Validar que el email no exista en la bd
            const existingUser = await prisma.usuari.findUnique({
                where: {
                    email: data.email
                }
            });

            // Validar que el username no exista en la bd
            const existingUsername = await prisma.usuari.findMany({
                where: {
                    nom: data.nom
                }
            });

            if (existingUser || existingUsername.length > 0) {
                throw new AppError("El email o el nombre de usuario ya existe", 409);
            }
            return await prisma.usuari.create({
                data: {
                    nom: data.nom,
                    cognoms: data.cognoms,
                    estat: data.estat,
                    email: data.email,
                    password: data.password,
                    restaurant: data.restaurant ? {
                        connect: { id: data.restaurant }
                    } : undefined,
                    rol: data.rol
                }
            });
        } catch (error) {
            console.error("Error detallado al crear el usuario en Prisma: ", error);

            // Verificamos si es un error específico de Prisma
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                // Por ejemplo, el código P2002 de Prisma significa "Violación de restricción Unique"
                throw new AppError(`Error de base de datos (Prisma message: ${error.meta?.cause || error.message}).`, 400);
            }

            if (error instanceof Prisma.PrismaClientValidationError) {
                throw new AppError("Faltan campos obligatorios o hay datos inválidos en tu solicitud.", 400);
            }

            if (error instanceof AppError) {
                throw error;
            }

            // Si es un error genérico o de validación
            throw new AppError("Error interno al crear el usuario: " + (error as Error).message, 500);
        }
    }
}