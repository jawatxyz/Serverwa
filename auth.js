// auth.js
export const redisAuth = (req, res, next) => {
    const apiKey = (req.headers['x-api-key'] || '').trim()
    const expectedKey = (process.env.API_KEY || '').trim()

    // Debug logs (check Render logs after redeploy)
    console.log("🔑 API key from request:", apiKey)
    console.log("🔑 API key from env:", expectedKey)

    if (!expectedKey) {
        console.error("❌ No API_KEY found in environment variables")
        return res.status(500).json({ error: 'Server misconfigured: missing API_KEY' })
    }

    if (apiKey !== expectedKey) {
        console.warn("❌ Invalid API key attempt")
        return res.status(401).json({ error: 'Invalid API key' })
    }

    next()
}
