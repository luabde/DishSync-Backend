import { z } from "zod";
import { RolUsuari, EstatGeneral } from "../../generated/prisma/client";

export const UserSchema = z.object({
  nom: z.string().min(1, "El nombre es obligatorio"),
  cognoms: z.string().min(1, "Los apellidos son obligatorios"),
  estat: z.enum(EstatGeneral).default(EstatGeneral.ACTIU),
  email: z.email("Email incorrecto"),
  password: z.string().min(6, "La contraseña tiene que ser minimo de 6 caracters"),
  restaurant: z.number().nullable(),
  rol: z.enum(RolUsuari)  // ← z.nativeEnum para enums de Prisma
});

export type UserDTO = z.infer<typeof UserSchema>;
