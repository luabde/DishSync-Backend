import { UserDTO } from "../models/user";
import { ContacteClientDTO } from "../models/contacte.model";
import { prisma } from "../loaders/prisma.loader";
import { AppError } from "../utils/AppError";

import { envConfig } from "../config/env.config";
import { Prisma } from "../../generated/prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class UserService {
    // Auth methods
    private static toSafeUser(user: {
        id: number;
        nom: string;
        email: string;
        rol: string;
    }) {
        return {
            id: user.id,
            nom: user.nom,
            email: user.email,
            rol: user.rol,
        };
    }

    static async createUser(data: UserDTO) {
        // Validar que el email no exista en la bd
        const existingUser = await prisma.usuari.findUnique({
            where: {
                email: data.email
            }
        });

        if (existingUser) {
            throw new AppError("El email ya existe", 409);
        }

        // Validar que el nombre de usuario no exista (comparación case-insensitive)
        const existingUsername = await prisma.usuari.findFirst({
            where: {
                nom: {
                    equals: data.nom.trim(),
                    mode: "insensitive",
                },
            },
            select: { id: true },
        });

        if (existingUsername) {
            throw new AppError("El nombre de usuario ya existe", 409);
        }

        const newUser = await prisma.usuari.create({
            data: {
                nom: data.nom,
                cognoms: data.cognoms,
                estat: data.estat,
                email: data.email,
                password: await bcrypt.hash(data.password, 10),
                restaurant: data.restaurant ? {
                    connect: { id: data.restaurant }
                } : undefined,
                rol: data.rol
            }
        });

        return newUser.id;
    }

    static async validateEmailExists(email: string) {
        // Endpoint de comprobación previa para formularios de alta/edición.
        const user = await prisma.usuari.findUnique({
            where: { email: email.trim() },
            select: { id: true },
        });
        return Boolean(user);
    }

    static async validateUsernameExists(username: string) {
        // Comprobación case-insensitive de duplicado sobre `nom`.
        const user = await prisma.usuari.findFirst({
            where: {
                nom: {
                    equals: username.trim(),
                    mode: "insensitive",
                },
            },
            select: { id: true },
        });
        return Boolean(user);
    }

    static async login(email: string, password: string) {
        const user = await prisma.usuari.findUnique({
            where: { email },
            select: {
                id: true,
                nom: true,
                email: true,
                rol: true,
                password: true,
                refreshToken: true,
            },
        });

        if (!user) {
            throw new AppError("Credenciales inválidas", 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new AppError("Credenciales inválidas", 401);
        }

        // Access token — corta duración
        const token = jwt.sign(
            { userId: user.id, nom: user.nom, email: user.email, rol: user.rol },
            envConfig.jwt.jwtSecret,
            { expiresIn: "1h" }
        );

        // Refresh token — larga duración
        const refreshToken = jwt.sign(
            { userId: user.id },
            envConfig.jwt.jwtRefreshSecret,
            { expiresIn: "7d" }
        );

        // Guardar refresh token en BD
        await prisma.usuari.update({
            where: { id: user.id },
            data: { refreshToken }
        });

        const safeUser = UserService.toSafeUser(user);
        return { user: safeUser, token, refreshToken };
    }

    static async refresh(refreshToken: string) {
        if (!refreshToken) throw new AppError("No autenticado", 401);

        // Verificar el refresh token
        const decoded = jwt.verify(refreshToken, envConfig.jwt.jwtRefreshSecret) as { userId: number };

        // Buscar usuario y verificar que el refresh token coincide con el de la BD
        const user = await prisma.usuari.findUnique({ where: { id: decoded.userId } });

        if (!user || user.refreshToken !== refreshToken) {
            throw new AppError("Refresh token inválido", 401);
        }

        // Generar nuevo access token
        const newToken = jwt.sign(
            { userId: user.id, nom: user.nom, email: user.email, rol: user.rol },
            envConfig.jwt.jwtSecret,
            { expiresIn: "1h" }
        );

        return { token: newToken };
    }

    static async logout(userId: number) {
        // Eliminar refresh token de la BD
        await prisma.usuari.update({
            where: { id: userId },
            data: { refreshToken: null }
        });
    }

    // Users methods
    static async getUsersForAssignment() {
        return prisma.usuari.findMany({
            where: {
                id_restaurant: null,
            },
            select: {
                id: true,
                nom: true,
                cognoms: true,
                email: true,
                rol: true,
                id_restaurant: true,
            },
            orderBy: { nom: "asc" },
        });
    }

    static async getAllUsers() {
        // Obtener todos los usuarios junto con el nombre del restaurante que tiene asignado
        return prisma.usuari.findMany({
            include: {
                restaurant:{
                    select: {
                        nom: true,
                    }
                }
            }
        });
    }

    // Obtiene el restaurante asignado al usuario autenticado (cambrer/responsable).
    static async getAssignedRestaurantByUserId(userId: number) {
        const user = await prisma.usuari.findUnique({
            where: { id: userId },
            select: {
                id: true,
                id_restaurant: true,
                restaurant: {
                    select: {
                        id: true,
                        nom: true,
                    },
                },
            },
        });

        if (!user) {
            throw new AppError("Usuario no encontrado", 404);
        }

        return {
            userId: user.id,
            id_restaurant: user.id_restaurant,
            restaurant: user.restaurant,
        };
    }

    // Alta de mensaje desde formulario público de contacto.
    // Si el cliente ya existe (email único), reutilizamos su registro.
    static async createContactForm(data: ContacteClientDTO) {
        const contactForm = await prisma.$transaction(async (tx) => {
            const client = await tx.client.upsert({
                where: { email: data.email },
                update: {
                    nom: data.nom,
                    cognoms: data.cognoms,
                    telefon: data.telefon,
                },
                create: {
                    nom: data.nom,
                    cognoms: data.cognoms,
                    email: data.email,
                    telefon: data.telefon,
                },
                select: { id: true },
            });

            return tx.contacteClient.create({
                data: {
                    id_client: client.id,
                    missatge: data.missatge,
                },
                select: {
                    id: true,
                    estat: true,
                    createdAt: true,
                },
            });
        });

        return contactForm;
    }

    // Formularios de contacto con el email del cliente para panel admin.
    static async getAllContactForms() {
        const contactForms = await prisma.contacteClient.findMany({
            select: {
                id: true,
                missatge: true,
                estat: true,
                createdAt: true,
                client: {
                    select: {
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return contactForms.map((item) => ({
            id: item.id,
            email: item.client.email,
            missatge: item.missatge,
            estat: item.estat,
            createdAt: item.createdAt,
        }));
    }

    static async markContactFormAsRead(contactId: number) {
        const contactForm = await prisma.contacteClient.findUnique({
            where: { id: contactId },
            select: {
                id: true,
                estat: true,
            },
        });

        if (!contactForm) {
            throw new AppError("Mensaje de contacto no encontrado", 404);
        }

        if (contactForm.estat === "Llegit") {
            return { id: contactForm.id, estat: contactForm.estat };
        }

        const updatedContact = await prisma.contacteClient.update({
            where: { id: contactId },
            data: { estat: "Llegit" },
            select: {
                id: true,
                estat: true,
            },
        });

        return updatedContact;
    }

    static async modifyUser(userId: number, data: UserDTO) {
        const user = await prisma.usuari.findUnique({
            where: { id: userId },
        });

        if(!user){
            throw new AppError("Usuario no encontrado", 404);
        }

        // Evitar colisiones de email con otros usuarios.
        if (data.email && data.email.trim() !== user.email) {
            const existingEmailUser = await prisma.usuari.findUnique({
                where: { email: data.email.trim() },
                select: { id: true },
            });
            if (existingEmailUser && existingEmailUser.id !== userId) {
                throw new AppError("El email ya existe", 409);
            }
        }

        // Evitar colisiones de nombre de usuario con otros usuarios.
        if (data.nom && data.nom.trim().toLowerCase() !== user.nom.trim().toLowerCase()) {
            const existingUsernameUser = await prisma.usuari.findFirst({
                where: {
                    nom: {
                        equals: data.nom.trim(),
                        mode: "insensitive",
                    },
                },
                select: { id: true },
            });
            if (existingUsernameUser && existingUsernameUser.id !== userId) {
                throw new AppError("El nombre de usuario ya existe", 409);
            }
        }

        const updateData: Prisma.UsuariUpdateInput = {
            nom: data.nom,
            cognoms: data.cognoms,
            estat: data.estat,
            email: data.email,
            rol: data.rol,
            // Password sólo se actualiza si llega valor; en caso contrario se conserva.
            ...(data.password ? { password: await bcrypt.hash(data.password, 10) } : {}),
            // Restaurante opcional: null => desconectar, número => conectar.
            ...(data.restaurant !== undefined
              ? data.restaurant === null
                ?{  restaurant: { disconnect: true } }
                : { restaurant: { connect: { id: data.restaurant } } }
              : {}),
        };

        return prisma.usuari.update({
            where: { id: userId },
            data: updateData,
        });
    }

    static async deleteUser(userId: number) {
        return prisma.usuari.delete({
            where: { id: userId },
        });
    }
}