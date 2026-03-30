import { RestaurantDTO } from "../models/restaurant.model";
import { prisma } from "../loaders/prisma.loader";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

export class RestaurantService {
    /**
     * Ejemplo base de alta de restaurante con imagen en local (entorno dev):
     * - Si llega fichero, se guarda en /public/restaurants
     * - Se genera una URL pública y se persiste en el campo `url`
     */
    static async createRestaurant(data: RestaurantDTO, imageFile?: Express.Multer.File) {
        let imageUrl = data.url;
        const { imageBase64, imageMimeType, imageOriginalName, ...restaurantData } = data as RestaurantDTO & {
            imageBase64?: string;
            imageMimeType?: string;
            imageOriginalName?: string;
        };

        if (imageFile) {
            const extension = path.extname(imageFile.originalname) || ".jpg";
            const fileName = `restaurant-${Date.now()}${extension}`;
            const publicDir = path.join(process.cwd(), "public", "restaurants");
            const filePath = path.join(publicDir, fileName);

            // Crea carpeta si no existe y guarda el binario
            await mkdir(publicDir, { recursive: true });
            await writeFile(filePath, imageFile.buffer);

            // URL accesible desde frontend gracias a express.static
            imageUrl = `/public/restaurants/${fileName}`;
        } else if (imageBase64) {
            // Fallback para flujo JSON: se recibe la imagen en base64 y se guarda igual en /public/restaurants
            const extensionFromMime = imageMimeType?.split("/")[1];
            const extensionFromName = imageOriginalName ? path.extname(imageOriginalName) : "";
            const extension = extensionFromName || (extensionFromMime ? `.${extensionFromMime}` : ".jpg");
            const fileName = `restaurant-${Date.now()}${extension}`;
            const publicDir = path.join(process.cwd(), "public", "restaurants");
            const filePath = path.join(publicDir, fileName);

            await mkdir(publicDir, { recursive: true });
            await writeFile(filePath, Buffer.from(imageBase64, "base64"));
            imageUrl = `/public/restaurants/${fileName}`;
        }

        // Guarda restaurante con la URL final de imagen
        return prisma.restaurant.create({
            data: {
                ...restaurantData,
                url: imageUrl,
            },
        });
    }

    static async getRestaurants() {
        const restaurants = await prisma.restaurant.findMany();
        return restaurants;
    }

}