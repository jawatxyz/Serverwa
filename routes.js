import express from 'express'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { getSocket, sessions } from './sessionManager.js'
import { config } from './config.js'

const router = express.Router()

function requireAuth(req, res, next) {
  const key = req.headers['x-api-key']
  if (key !== config.API_KEY) return res.status(403).json({ error: 'Invalid API key' })
  next()
}

router.use(requireAuth)

router.post('/session', async (req, res) => {
  const id = uuidv4()
  await getSocket(id)
  res.json({ sessionId: id })
})

router.post('/session/:id/pair', async (req, res) => {
  const { id } = req.params
  const { phone } = req.body
  if (!phone) return res.status(400).json({ error: 'Phone required (E.164 without +)' })
  const sock = await getSocket(id)
  try {
    const code = await sock.requestPairingCode(phone)
    res.json({ pairingCode: code })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/session/:id/sendText', async (req, res) => {
  const { id } = req.params
  const { jid, text } = req.body
  if (!jid || !text) return res.status(400).json({ error: 'jid and text required' })
  const sock = await getSocket(id)
  const result = await sock.sendMessage(jid, { text })
  res.json({ id: result.key.id })
})

router.post('/session/:id/sendMedia', async (req, res) => {
  const { id } = req.params
  const { jid, caption, url } = req.body
  if (!jid || !url) return res.status(400).json({ error: 'jid and url required' })
  const sock = await getSocket(id)
  const buffer = fs.readFileSync(url)
  const result = await sock.sendMessage(jid, { image: buffer, caption: caption || '' })
  res.json({ id: result.key.id })
})

router.get('/session/:id/status', async (req, res) => {
  const { id } = req.params
  const sock = await getSocket(id)
  res.json({ connected: !!sock.ws })
})

router.get('/media', (req, res) => {
  const files = fs.readdirSync(config.MEDIA_DIR)
  res.json(files)
})

export default router
