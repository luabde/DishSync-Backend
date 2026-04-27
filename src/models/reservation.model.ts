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

