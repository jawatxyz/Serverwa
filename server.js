// server.js
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import { config } from './config.js'
import { requireApiKey } from './auth.js'
import router from './routes.js'

const app = express()

// Middleware
app.use(express.json())
app.use(requireApiKey) // protect routes with x-api-key

// Routes
app.use('/', router)

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(` HTTP server running on :${PORT}`)
})
