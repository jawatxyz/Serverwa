// sessionManager.js
import makeWASocket from '@whiskeysockets/baileys';
import { redisAuth } from './auth.js';

/**
 * Initialize or load a Baileys session from Redis
 * @param {string} sessionId Unique session identifier
 */
export async function initSession(sessionId) {
  const { readCredentials, writeCredentials, keys } = redisAuth(sessionId);

  // Load stored credentials
  let creds = await readCredentials();

  // First-time login: initialize empty creds object
  if (!creds) {
    creds = { me: undefined };
    await writeCredentials(creds);
  }

  // Create the WhatsApp socket
  const sock = makeWASocket({
    printQRInTerminal: true, // optional, shows QR in terminal for first login
    auth: { creds, keys },   // pass creds + optional keys store
  });

  // Listen for credential updates and save them to Redis
  sock.ev.on('creds.update', async (updatedCreds) => {
    try {
      await writeCredentials(updatedCreds);
      console.log(`[${sessionId}] creds updated and saved to Redis`);
    } catch (err) {
      console.error(`[${sessionId}] error saving creds:`, err);
    }
  });

  // Optional: listen to connection state
  sock.ev.on('connection.update', (update) => {
    console.log(`[${sessionId}] connection update:`, update);
  });

  return sock;
}
