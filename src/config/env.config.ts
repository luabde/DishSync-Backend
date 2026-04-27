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

  frontend: {
    baseUrl: process.env.FRONTEND_BASE_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  api: {
    baseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || '3000'}/api`,
  },

  // JWT
  jwt: {
    jwtSecret: process.env.JWT_SECRET || 'default_secret_key',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key',
  },

  // SMTP / correo
  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT || 587),
    secure: (process.env.MAIL_SECURE || 'false') === 'true',
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
    from: process.env.MAIL_FROM || (process.env.MAIL_USER ? `El Castell <${process.env.MAIL_USER}>` : 'El Castell <no-reply@elcastell.local>'),
  },
};