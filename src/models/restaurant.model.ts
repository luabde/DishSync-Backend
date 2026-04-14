import {z} from "zod";
import {EstatGeneral} from "../../generated/prisma/client";

const WizardShiftSchema = z.object({
  id: z.string(),
  name: z.string(),
  times: z.array(z.string()),
});

const WizardZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const WizardTableSchema = z.object({
  id: z.string(),
  tableTypeId: z.number(),
  type: z.number(),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
});

const WizardDataSchema = z.object({
  shifts: z.array(WizardShiftSchema).default([]),
  zones: z.array(WizardZoneSchema).default([]),
  selectedUsers: z.array(z.object({ id: z.number() })).default([]),
  tableTypesCatalog: z.array(z.unknown()).optional(),
  tablesByZone: z.record(z.string(), z.array(WizardTableSchema)).default({}),
});

export const RestaurantSchema = z.object({
  nom:       z.string().min(1),
  direccio:  z.string().min(1),
  horaris:   z.string().min(1),
  telefon:   z.string().min(9),
  // Puede venir URL ya existente o vacía para usar upload local.
  url:       z.string().optional().default(""),
  descripcio: z.string().optional(),
  // Datos globales del wizard enviados desde frontend para inserts relacionados
  wizardData: WizardDataSchema.optional(),
});

// En update no permitimos cambiar `horaris` para evitar impactos
// en la lógica de turnos/reservas.
export const UpdateRestaurantSchema = z.object({
  nom: z.string().min(1),
  direccio: z.string().min(1),
  telefon: z.string().min(9),
  url: z.string().optional().default(""),
  descripcio: z.string().optional(),
});

export type RestaurantDTO = z.infer<typeof RestaurantSchema>;
export type UpdateRestaurantDTO = z.infer<typeof UpdateRestaurantSchema>;
export type EstatGeneralDTO = z.infer<typeof EstatGeneral>;