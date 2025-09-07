// sessionManager.js
import makeWASocket from '@whiskeysockets/baileys';
import { redisAuth } from './auth.js';

// Map to store all active sessions
export const sessions = new Map(); // key = sessionId, value = socket

/**
 * Get existing socket or initialize a new one
 * @param {string} sessionId Unique session identifier
 */
export async function getSocket(sessionId) {
  if (sessions.has(sessionId)) return sessions.get(sessionId);

  const { readCredentials, writeCredentials, keys } = redisAuth(sessionId);

  // Load credentials from Redis or initialize empty for first-time
  let creds = await readCredentials();
  if (!creds) {
    creds = { me: undefined };
    await writeCredentials(creds);
  }

  // Create Baileys socket (QR-less)
  const sock = makeWASocket({
    printQRInTerminal: false, // No QR
    auth: { creds, keys },
  });

  // Save updates to Redis
  sock.ev.on('creds.update', async (updatedCreds) => {
    try {
      await writeCredentials(updatedCreds);
      console.log(`[${sessionId}] creds updated`);
    } catch (err) {
      console.error(`[${sessionId}] error saving creds`, err);
    }
  });

  sock.ev.on('connection.update', (update) => {
    console.log(`[${sessionId}] connection update`, update);
  });

  sessions.set(sessionId, sock);
  return sock;
}
