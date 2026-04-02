import { UserDTO } from "../models/user";
import { prisma } from "../loaders/prisma.loader";
import { AppError } from "../utils/AppError";

import { envConfig } from "../config/env.config";
import { Prisma } from "../../generated/prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class UserService {
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
}