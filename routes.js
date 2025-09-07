// routes.js
import express from 'express';
import { getSocket } from './sessionManager.js';
import { redis } from './db.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * Generate pairing session for a specific phone number
 */
router.post('/pair/generate', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'Phone number is required' });

  const sessionId = crypto.randomUUID();
  await redis.set(`pair:${sessionId}`, phoneNumber, 'EX', 300); // expires in 5 min

  try {
    const sock = await getSocket(sessionId, phoneNumber);
    // The server logs the WhatsApp-issued pairing code; you can also send it in the response
    res.json({ sessionId, message: 'Pairing code generated, check server logs for the ref' });
  } catch (err) {
    console.error('Error generating pairing session:', err);
    res.status(500).json({ error: 'Failed to generate pairing session' });
  }
});

/**
 * Use the pairing code to complete linking (optional endpoint)
 */
router.post('/pair/use', async (req, res) => {
  const { sessionId } = req.body;
  const phoneNumber = await redis.get(`pair:${sessionId}`);
  if (!phoneNumber) return res.status(400).json({ error: 'Invalid or expired session ID' });

  try {
    await getSocket(sessionId, phoneNumber);
    res.json({ message: `Session ${sessionId} linked successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to link session' });
  }
});

export default router;
