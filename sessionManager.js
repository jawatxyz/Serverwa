// sessionManager.js
import makeWASocket, { Browsers } from '@whiskeysockets/baileys';
import { redisAuth } from './auth.js';

export const sessions = new Map(); // key = sessionId, value = socket

/**
 * Get existing socket or initialize a new one
 * @param {string} sessionId Unique session identifier
 * @param {string} phoneNumber Phone number of the WhatsApp account
 */
export async function getSocket(sessionId, phoneNumber) {
  if (sessions.has(sessionId)) return sessions.get(sessionId);

  const { readCredentials, writeCredentials, keys } = redisAuth(sessionId);

  // Load credentials from Redis or initialize empty
  let creds = await readCredentials();
  if (!creds) {
    creds = { me: undefined };
    await writeCredentials(creds);
  }

  const sock = makeWASocket({
    printQRInTerminal: false, // NEVER show QR
    auth: { creds, keys },
    browser: Browsers.macOS('Desktop'),
  });

  // Request pairing code from WhatsApp for this account
  try {
    const { ref, ttl } = await sock.generatePairingCode(phoneNumber); 
    console.log(`[${sessionId}] Pairing code generated for ${phoneNumber}: ${ref}, expires in ${ttl} sec`);
    // Send `ref` to frontend; user enters this in WhatsApp main account
  } catch (error) {
    console.error(`[${sessionId}] Error requesting pairing code:`, error);
  }

  // Detect when device is successfully linked
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      console.log(`[${sessionId}] Successfully paired with WhatsApp main account!`);
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
