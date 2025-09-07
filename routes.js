// routes.js
import express from 'express';
import { getSocket } from './sessionManager.js';
import { redis } from './db.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * Generate pairing code for client device
 */
router.post('/pair/generate', async (req, res) => {
  const sessionId = req.body.sessionId || crypto.randomUUID();
  const pairCode = crypto.randomBytes(3).toString('hex'); // 6-digit hex

  await redis.set(`pair:${pairCode}`, sessionId, 'EX', 300); // expires 5 mins
  res.json({ sessionId, pairCode });
});

/**
 * Use pairing code in WhatsApp main account linking
 */
router.post('/pair/use', async (req, res) => {
  const { pairCode } = req.body;
  const sessionId = await redis.get(`pair:${pairCode}`);

  if (!sessionId) return res.status(400).json({ error: 'Invalid or expired pairing code' });

  try {
    await getSocket(sessionId); // initialize socket / detect pairing
    res.json({ message: `Session ${sessionId} paired successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to initialize session' });
  }
});

export default router;
