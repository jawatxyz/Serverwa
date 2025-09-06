import dotenv from 'dotenv'
dotenv.config()

export const config = {
  PORT: process.env.PORT || 3000,
  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  API_KEY: process.env.API_KEY || 'changeme',
  MEDIA_DIR: process.env.MEDIA_DIR || './media'
}
