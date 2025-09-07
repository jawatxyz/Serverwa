// routes.js
import express from 'express';
import { getSocket, sessions } from './sessionManager.js';
import { redis } from './db.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * Generate a new pairing code
 */
router.post('/pair/generate', async (req, res) => {
  const sessionId = req.body.sessionId || crypto.randomUUID();
  const pairCode = crypto.randomBytes(3).toString('hex'); // 6-digit hex

  // Store pairing code in Redis, expires in 5 min
  await redis.set(`pair:${pairCode}`, sessionId, 'EX', 300);

  res.json({ sessionId, pairCode });
});

/**
 * Use a pairing code to start a session
 */
router.post('/pair/use', async (req, res) => {
  const { pairCode } = req.body;
  const sessionId = await redis.get(`pair:${pairCode}`);

  if (!sessionId) return res.status(400).json({ error: 'Invalid or expired pairing code' });

  try {
    await getSocket(sessionId);
    res.json({ message: `Session ${sessionId} paired successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to initialize session' });
  }
});

export default router;
