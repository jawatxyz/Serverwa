import express from 'express'
import fs from 'fs'
import { WebSocketServer } from 'ws'
import { sessions, getSocket } from './sessionManager.js'
import { config } from './config.js'
import router from './routes.js'
import P from 'pino'

const logger = P({ level: 'info' })

if (!fs.existsSync(config.MEDIA_DIR)) fs.mkdirSync(config.MEDIA_DIR)

const app = express()
app.use(express.json())
app.use('/', router)

const server = app.listen(config.PORT, () => logger.info(`HTTP on :${config.PORT}`))

const wss = new WebSocketServer({ server, path: '/ws' })
wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.split('?')[1] || '')
  const sessionId = params.get('sessionId')
  if (!sessionId) {
    ws.close(1008, 'sessionId required')
    return
  }
  getSocket(sessionId).then(() => {
    sessions.get(sessionId).clients.add(ws)
  })
  ws.on('close', () => {
    if (sessions.has(sessionId)) sessions.get(sessionId).clients.delete(ws)
  })
})
