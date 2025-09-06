import { makeWASocket, Browsers, downloadMediaMessage } from '@whiskeysockets/baileys'
import fs from 'fs'
import path from 'path'
import P from 'pino'
import { redisAuth } from './auth.js'
import { config } from './config.js'

const logger = P({ level: 'info' })
export const sessions = new Map()

export async function getSocket(sessionId) {
  if (sessions.has(sessionId)) return sessions.get(sessionId).sock

  const { readCredentials, writeCredentials, keys } = redisAuth(sessionId)
  const creds = await readCredentials()

  const sock = makeWASocket({
    browser: Browsers.macOS('Chrome'),
    logger,
    auth: { creds: creds || undefined, keys },
    syncFullHistory: true,
    markOnlineOnConnect: false
  })

  sock.ev.on('creds.update', writeCredentials)
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const m of messages) {
      if (m.message?.imageMessage || m.message?.videoMessage || m.message?.documentMessage) {
        try {
          const buffer = await downloadMediaMessage(m, 'buffer', {}, { logger })
          const filename = path.join(config.MEDIA_DIR, `${m.key.id}.bin`)
          fs.writeFileSync(filename, buffer)
          logger.info(`Saved media -> ${filename}`)
        } catch (e) {
          logger.error(e, 'Media download failed')
        }
      }
    }
    broadcast(sessionId, { type: 'messages.upsert', payload: messages })
  })

  sock.ev.on('connection.update', (u) => {
    broadcast(sessionId, { type: 'connection.update', payload: u })
  })

  sessions.set(sessionId, { sock, clients: new Set() })
  return sock
}

export function broadcast(sessionId, msg) {
  const entry = sessions.get(sessionId)
  if (!entry) return
  const data = JSON.stringify(msg)
  for (const c of entry.clients) {
    try { c.send(data) } catch {}
  }
}
