import express from "express"
import { startSession, listSessions } from "./sessionManager.js"
import { redisAuth } from "./auth.js"

const router = express.Router()

// Create a session (generate pairing code)
router.post("/session", redisAuth, async (req, res) => {
  try {
    const { phoneNumber } = req.body
    if (!phoneNumber) {
      return res.status(400).json({ error: "phoneNumber is required" })
    }

    const result = await startSession(phoneNumber)
    res.json(result)
  } catch (err) {
    console.error("Error starting session:", err)
    res.status(500).json({ error: err.message })
  }
})

// List active sessions
router.get("/sessions", redisAuth, (req, res) => {
  res.json({ sessions: listSessions() })
})

export default router
