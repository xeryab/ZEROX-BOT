const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require("@adiwajshing/baileys")
const P = require("pino")
const fs = require("fs")
const path = require("path")

async function startBot() {
    const { state, saveState } = useSingleFileAuthState("auth_info.json")
    const sock = makeWASocket({
        logger: P({ level: "silent" }),
        printQRInTerminal: true,
        auth: state
    })

    sock.ev.on("creds.update", saveState)

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || !msg.key.remoteJid) return

        const from = msg.key.remoteJid
        const type = Object.keys(msg.message)[0]
        const isImage = type === "imageMessage"
        const isReply = !!msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ""

        if (text.startsWith(".sticker") && isReply) {
            const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage
            const buffer = await sock.downloadMediaMessage({ message: { imageMessage: quoted } })
            await sock.sendMessage(from, { sticker: buffer }, { quoted: msg })
        }
    })
}

startBot()