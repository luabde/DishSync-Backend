import { z } from "zod";

export const CreateReservationSchema = z.object({
  nom: z.string().min(1, "El nombre es obligatorio"),
  cognoms: z.string().optional().default(""),
  email: z.string().email("El email no es válido"),
  telefon: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
  id_taula_restaurant: z.number().int().positive(),
  id_torn: z.number().int().positive(),
  data: z.string().min(1, "La fecha es obligatoria"),
  hora: z.string().min(1, "La hora es obligatoria"),
  num_persones: z.number().int().positive(),
  observacions: z.string().optional(),
});

export type CreateReservationDTO = z.infer<typeof CreateReservationSchema>;

export const CreateReservationByStaffSchema = z.object({
  nom: z.string().min(1, "El nombre es obligatorio"),
  cognoms: z.string().optional().default(""),
  email: z.union([z.string().email("El email no es válido"), z.literal("")]).optional(),
  telefon: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
  id_taula_restaurant: z.number().int().positive(),
  id_torn: z.number().int().positive(),
  data: z.string().min(1, "La fecha es obligatoria"),
  hora: z.string().min(1, "La hora es obligatoria"),
  num_persones: z.number().int().positive(),
  estat: z.enum(["RESERVADA", "OCUPADA"]),
  observacions: z.string().optional(),
});

export type CreateReservationByStaffDTO = z.infer<typeof CreateReservationByStaffSchema>;

export const UpdateReservationByStaffSchema = z
  .object({
    // Clave oficial usada por backend.
    nom_contacte: z.string().min(1, "El nombre del contacto es obligatorio").optional(),
    // Alias legacy para compatibilidad con payloads anteriores de frontend.
    nomClient: z.string().min(1, "El nombre del contacto es obligatorio").optional(),
    id_taula_restaurant: z.number().int().positive(),
    id_torn: z.number().int().positive(),
    data: z.string().min(1, "La fecha es obligatoria"),
    hora: z.string().min(1, "La hora es obligatoria"),
    num_persones: z.number().int().positive(),
    estat: z.enum(["RESERVADA", "OCUPADA", "LLIURE"]),
    observacions: z.string().optional(),
  })
  .transform(({ nomClient, nom_contacte, ...rest }) => ({
    ...rest,
    nom_contacte: nom_contacte ?? nomClient,
  }));

export type UpdateReservationByStaffDTO = z.infer<typeof UpdateReservationByStaffSchema>;

