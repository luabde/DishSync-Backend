import {z} from "zod";

export const PlatSchema = z.object({
    nom: z.string().min(1),
    descripcio: z.string(),
    preu: z.number().min(0),
    url: z.string(),
    id_categoria: z.number().min(1)
});

export const UpdatePlatSchema = z.object({
    nom: z.string().min(1),
    descripcio: z.string(),
    // En multipart/form-data llega como string; coerce evita rechazarlo.
    id_categoria: z.coerce.number().min(1),
    // Vacia para eliminar la imagen actual si no se sube una nueva.
    url: z.string().optional().default(""),
});

export type PlatDTO = z.infer<typeof PlatSchema>;
export type UpdatePlatDTO = z.infer<typeof UpdatePlatSchema>;