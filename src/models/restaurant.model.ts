import {z} from "zod";
import {EstatGeneral} from "../../generated/prisma/client";

export const RestaurantSchema = z.object({
  nom:       z.string().min(1),
  direccio:  z.string().min(1),
  horaris:   z.string().min(1),
  telefon:   z.string().min(9),
  // Puede venir URL ya existente o vacía para usar upload local.
  url:       z.string().optional().default(""),
  descripcio: z.string().optional(),
  // Para flujo JSON en frontend: imagen serializada en base64 (sin prefijo data:)
  imageBase64: z.string().optional(),
  imageMimeType: z.string().optional(),
  imageOriginalName: z.string().optional(),
});

export type RestaurantDTO = z.infer<typeof RestaurantSchema>;
export type EstatGeneralDTO = z.infer<typeof EstatGeneral>;