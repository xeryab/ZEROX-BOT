const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
const { Boom } = require("@hapi/boom")
const P = require("pino")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")

  const sock = makeWASocket({
    version: await fetchLatestBaileysVersion(),
    logger: P({ level: "silent" }),
    auth: state,
    browser: ["𝗭𝗥𝗚𝗜𝗔 💋", "Safari", "1.0.0"]
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", ({ connection, pairingCode, isNewLogin }) => {
    if (pairingCode && isNewLogin) {
      console.log("💖 Pair this device using code:", pairingCode)
    }
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || !msg.key.remoteJid) return

    const from = msg.key.remoteJid
    const isReply = !!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ""

    if (text.startsWith(".sticker") && isReply) {
      const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage
      const buffer = await sock.downloadMediaMessage({ message: { imageMessage: quoted } })
      await sock.sendMessage(from, { sticker: buffer }, { quoted: msg })
    }
  })
}

startBot()
