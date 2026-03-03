import express, { Request, Response } from "express";
import cors from "cors";

// Crear la app de Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Variables de entorno
const PORT = process.env.PORT || 3000;

// Rutas de ejemplo
app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "Servidor DishSync funcionando 🚀",
    nodeEnv: process.env.NODE_ENV
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log("NODE_ENV:", process.env.NODE_ENV);
});