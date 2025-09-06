import { redis } from './db.js'

export function redisAuth(sessionId) {
  const authKey = `wa:${sessionId}:creds`
  const keysKey = `wa:${sessionId}:keys`
  return {
    async readCredentials() {
      const raw = await redis.get(authKey)
      return raw ? JSON.parse(raw) : undefined
    },
    async writeCredentials(creds) {
      await redis.set(authKey, JSON.stringify(creds))
    },
    keys: {
      async get(type, ids) {
        const data = JSON.parse((await redis.get(keysKey)) || '{}')
        const result = {}
        for (const id of ids) result[id] = data?.[type]?.[id]
        return result
      },
      async set(data) {
        const prev = JSON.parse((await redis.get(keysKey)) || '{}')
        for (const category in data) {
          prev[category] = { ...(prev[category] || {}), ...data[category] }
        }
        await redis.set(keysKey, JSON.stringify(prev))
      }
    }
  }
}
