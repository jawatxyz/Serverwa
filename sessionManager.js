// sessionManager.js
import makeWASocket from '@whiskeysockets/baileys';
import { redisAuth } from './auth.js';

export const sessions = new Map(); // key = sessionId, value = socket

/**
 * Get existing socket or initialize a new one
 */
export async function getSocket(sessionId) {
  if (sessions.has(sessionId)) return sessions.get(sessionId);

  const { readCredentials, writeCredentials, keys } = redisAuth(sessionId);

  // Load credentials or initialize empty
  let creds = await readCredentials();
  if (!creds) {
    creds = { me: undefined };
    await writeCredentials(creds);
  }

  const sock = makeWASocket({
    printQRInTerminal: false, // QR not needed
    auth: { creds, keys },
  });

  // Detect pairing code connection updates
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Log pairing info
    if (qr) {
      console.log(`[${sessionId}] Received QR/pairing info:`, qr);
      // Optional: forward QR/pairing code to frontend if needed
    }

    if (connection === 'open') {
      console.log(`[${sessionId}] Connected successfully via pairing code!`);
    }

    if (connection === 'close' && lastDisconnect?.error) {
      console.error(`[${sessionId}] Disconnected:`, lastDisconnect.error);
    }
  });

  // Save credentials to Redis whenever updated
  sock.ev.on('creds.update', async (updatedCreds) => {
    await writeCredentials(updatedCreds);
    console.log(`[${sessionId}] creds updated`);
  });

  sessions.set(sessionId, sock);
  return sock;
}
