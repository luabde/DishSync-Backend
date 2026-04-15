import {z} from "zod";

export const PlatSchema = z.object({
    nom: z.string().min(1),
    descripcio: z.string(),
    preu: z.number().min(0),
    url: z.string(),
    id_categoria: z.number().min(1)
});

export type PlatDTO = z.infer<typeof PlatSchema>;