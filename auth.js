// auth.js
import { redis } from './db.js';
import { config } from './config.js';

/**
 * Factory used by sessionManager.js to read/write Baileys credentials from Redis.
 * Usage:
 *   const { readCredentials, writeCredentials, keys } = redisAuth(sessionId)
 */
export function redisAuth(sessionId) {
  const key = `baileys:creds:${sessionId}`;

  return {
    // read stored credentials (or null)
    readCredentials: async () => {
      try {
        const raw = await redis.get(key);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (err) {
        console.error('readCredentials error', err);
        throw err;
      }
    },

    // write updated creds
    writeCredentials: async (creds) => {
      try {
        await redis.set(key, JSON.stringify(creds));
      } catch (err) {
        console.error('writeCredentials error', err);
        throw err;
      }
    },

    // keys: leave undefined or implement key-store API if needed by Baileys.
    // For many Baileys versions passing undefined works (they use a default in-memory keystore).
    // If you need persistent key-store operations, implement the KeyStore API here.
    keys: undefined
  };
}

/**
 * Express middleware to require API key (x-api-key) from requests.
 * Use in server.js like: app.use(requireApiKey)
 */
export function requireApiKey(req, res, next) {
  // Debug logging — leave or remove as you prefer
  console.log('Incoming headers:', req.headers);

  const apiKey = (req.headers['x-api-key'] || '').trim();
  const expectedKey = (process.env.API_KEY || '').trim();

  console.log('API key from request:', JSON.stringify(apiKey));
  console.log('API key from env:', JSON.stringify(expectedKey));

  if (!expectedKey) {
    console.error('❌ No API_KEY found in environment variables');
    return res.status(500).json({ error: 'Server misconfigured: missing API_KEY' });
  }

  if (apiKey !== expectedKey) {
    console.warn('❌ Invalid API key attempt');
    return res.status(401).json({ error: 'Invalid API key' });
  }

  return next();
}
