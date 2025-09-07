// auth.js
export const redisAuth = (req, res, next) => {
    // 🔍 Log all incoming headers
    console.log("🔍 Incoming headers:", req.headers)

    // Get API key from request and env, trim whitespace
    const apiKey = (req.headers['x-api-key'] || '').trim()
    const expectedKey = (process.env.API_KEY || '').trim()

    // Log with quotes to reveal hidden characters
    console.log("🔑 API key from request:", JSON.stringify(apiKey))
    console.log("🔑 API key from env:", JSON.stringify(expectedKey))

    if (!expectedKey) {
        console.error("❌ No API_KEY found in environment variables")
        return res.status(500).json({ error: 'Server misconfigured: missing API_KEY' })
    }

    if (apiKey !== expectedKey) {
        console.warn("❌ Invalid API key attempt")
        // Optional: show difference
        const diff = []
        for (let i = 0; i < Math.max(apiKey.length, expectedKey.length); i++) {
            if (apiKey[i] !== expectedKey[i]) diff.push({ index: i, request: apiKey[i], env: expectedKey[i] })
        }
        console.warn("⚠️ Diff:", diff)
        return res.status(401).json({ error: 'Invalid API key' })
    }

    next()
}
