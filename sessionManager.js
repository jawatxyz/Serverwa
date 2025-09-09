import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys"

const sessions = {} // store sockets in memory

// Start a new WhatsApp session (with pairing code)
export async function startSession(phoneNumber) {
  if (!phoneNumber) throw new Error("Phone number is required")

  // useMultiFileAuthState saves creds in sessions/<phoneNumber>
  const { state, saveCreds } = await useMultiFileAuthState(`sessions/${phoneNumber}`)

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // we don’t want QR
    browser: ["Serverwa", "Chrome", "1.0.0"]
  })

  // request a pairing code if not registered
  if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode(phoneNumber)
    console.log(`Pairing code for ${phoneNumber}:`, code)
    return { status: "pending", pairingCode: code }
  }

  sock.ev.on("creds.update", saveCreds)

  sessions[phoneNumber] = sock
  console.log(`✅ WhatsApp session started for ${phoneNumber}`)

  return { status: "connected" }
}

// Get an existing socket
export function getSocket(phoneNumber) {
  return sessions[phoneNumber]
}

// List all active sessions
export function listSessions() {
  return Object.keys(sessions)
}
