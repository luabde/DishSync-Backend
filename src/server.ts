import express from "express";
import { initLoaders } from "./loaders";
import { envConfig } from "./config/env.config";


const startServer = async () => {
  const app = express();

  // Inicializar loaders (Base de datos, Express middlewares, rutas, etc.)
  await initLoaders(app);

  const PORT = envConfig.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log("NODE_ENV:", process.env.NODE_ENV);
  });
};

startServer();