import { z } from "zod";

export const ContacteClientSchema = z.object({
  nom: z.string().trim().min(1, "El nombre es obligatorio"),
  cognoms: z.string().trim().min(1, "Los apellidos son obligatorios"),
  email: z.email("Email incorrecto").transform((value) => value.trim().toLowerCase()),
  telefon: z.string().trim().min(1, "El teléfono es obligatorio"),
  missatge: z.string().trim().min(1, "El mensaje es obligatorio"),
});

export type ContacteClientDTO = z.infer<typeof ContacteClientSchema>;
