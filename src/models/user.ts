import { z } from "zod";
import { RolUsuari, EstatGeneral } from "../../generated/prisma/client";

// Shema completo - para crear usuario
export const UserSchema = z.object({
  nom: z.string().min(1, "El nombre es obligatorio"),
  cognoms: z.string().min(1, "Los apellidos son obligatorios"),
  estat: z.enum(EstatGeneral).default(EstatGeneral.ACTIU),
  email: z.email("Email incorrecto"),
  password: z.string().min(6, "La contraseña tiene que ser minimo de 6 caracters"),
  restaurant: z.number().nullable().optional(),
  rol: z.enum(RolUsuari)  // ← z.nativeEnum para enums de Prisma
});

// Shema login - solo con el email y password
export const LoginSchema = z.object({
  email: z.email("Email incorrecto"),
  password: z.string().min(6, "La contraseña tiene que ser minimo de 6 caracters")
});

// Exportamos los tipos para usarlos en servicios y controladores
export type UserDTO = z.infer<typeof UserSchema>;
export type LoginDTO = z.infer<typeof LoginSchema>;