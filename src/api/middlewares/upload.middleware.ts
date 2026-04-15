import multer from "multer";

// Usamos memoryStorage para delegar el guardado físico al service.
// Así mantenemos la lógica de "dónde y cómo guardar" en la capa de negocio.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Campo esperado desde frontend: "image"
export const uploadRestaurantImage = upload.single("image");
export const uploadDishImage = upload.single("image");
