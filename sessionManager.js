import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys"

const sessions = {} // store sockets in memory

export async function startSession(phoneNumber) {
  if (!phoneNumber) throw new Error("Phone number is required")

  console.log(`[SessionManager] Starting session for ${phoneNumber}`)

  const { state, saveCreds } = await useMultiFileAuthState(`sessions/${phoneNumber}`)

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Serverwa", "Chrome", "1.0.0"]
  })

  // log connection updates
  sock.ev.on("connection.update", (update) => {
    console.log(`[Baileys][${phoneNumber}] Connection update:`, update)
  })

  sock.ev.on("creds.update", saveCreds)

  try {
    if (!sock.authState.creds.registered) {
      console.log(`[Baileys][${phoneNumber}] Requesting pairing code...`)

      const code = await Promise.race([
        sock.requestPairingCode(phoneNumber),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout requesting pairing code")), 15000)
        )
      ])

      console.log(`[Baileys][${phoneNumber}] Pairing code received: ${code}`)
      return { status: "pending", pairingCode: code }
    }

    sessions[phoneNumber] = sock
    console.log(`[Baileys][${phoneNumber}] Session restored and connected ✅`)

    return { status: "connected" }
  } catch (err) {
    console.error(`[Baileys][${phoneNumber}] Failed to start session:`, err)
    return { status: "error", message: err.message }
  }
}

export function getSocket(phoneNumber) {
  return sessions[phoneNumber]
}

export function listSessions() {
  return Object.keys(sessions)
}
