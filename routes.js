import express from 'express'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { getSocket, sessions } from './sessionManager.js'
import { config } from './config.js'

const router = express.Router()

// ❌ REMOVE this
// function requireAuth(req, res, next) {
//   const key = req.headers['x-api-key']
//   if (key !== config.API_KEY) return res.status(403).json({ error: 'Invalid API key' })
//   next()
// }
// router.use(requireAuth)

router.post('/session', async (req, res) => {
  const id = uuidv4()
  await getSocket(id)
  res.json({ sessionId: id })
})

// … rest unchanged …
export default router
