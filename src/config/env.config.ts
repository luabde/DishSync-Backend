import dotenv from 'dotenv';

// Carregar variables d'entorn
dotenv.config();

/*
 * Configuració centralitzada de variables d'entorn
 * Totes les variables estan tipades i amb valors per defecte
 */
export const envConfig = {
  // Node
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '3000',

  // Database
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  },

  // JWT
  jwt: {
    jwtSecret: process.env.JWT_SECRET || 'default_secret_key',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key',
  }
};