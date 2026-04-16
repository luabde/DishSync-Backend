import {z} from "zod";

export const PlatSchema = z.object({
    nom: z.string().min(1),
    descripcio: z.string(),
    // En multipart/form-data llega como string; coerce evita rechazos en validación. Lo conviera a numero
    preu: z.coerce.number().min(0),
    url: z.string().optional().default(""),
    id_categoria: z.coerce.number().min(1)
});

export const UpdatePlatSchema = z.object({
    nom: z.string().min(1),
    descripcio: z.string(),
    // En multipart/form-data llega como string; coerce evita rechazarlo.
    id_categoria: z.coerce.number().min(1),
    // Vacia para eliminar la imagen actual si no se sube una nueva.
    url: z.string().optional().default(""),
});

export const CategoriaSchema = z.object({
    nom: z.string().min(1),
    descripcio: z.string().optional().default(""),
});

export type PlatDTO = z.infer<typeof PlatSchema>;
export type UpdatePlatDTO = z.infer<typeof UpdatePlatSchema>;
export type CategoriaDTO = z.infer<typeof CategoriaSchema>;