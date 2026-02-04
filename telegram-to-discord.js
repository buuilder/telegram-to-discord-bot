import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";

console.log("🚀 Telegram → Discord (formato finale con avatar e nome in grassetto)");

// ===== Variabili =====
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

if (!TELEGRAM_TOKEN || !DISCORD_WEBHOOK_URL) {
  console.error("❌ Variabili ambiente mancanti");
  process.exit(1);
}

// ===== Bot Telegram =====
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
console.log("🤖 Telegram bot avviato");

// ===== Handler messaggi =====
bot.on("message", async (msg) => {
  try {
    if (msg.from?.is_bot) return;

    const tgName = msg.from.first_name || "Utente";
    let avatarUrl = null;

    // 🔹 Prendi avatar Telegram
    const photos = await bot.getUserProfilePhotos(msg.from.id, { limit: 1 });
    if (photos.total_count > 0) {
      const photo = photos.photos[0][photos.photos[0].length - 1];
      const file = await bot.getFile(photo.file_id);
      avatarUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;
    }

    // 🔹 Gestione reply
    let content = "";
    if (msg.reply_to_message) {
      const r = msg.reply_to_message;
      const rName = r.from?.first_name || "Utente";
      const rText = r.text || r.caption || "[media]";
      content += `> ${rName}: ${rText}\n\n`;
    }

    // 🔹 Testo principale
    if (msg.text) {
      content += msg.text;
    }

    // 🔹 Foto o file
    if (msg.photo || msg.document || msg.video || msg.audio) {
      let fileUrl = null;
      if (msg.photo) {
        const photo = msg.photo[msg.photo.length - 1];
        const file = await bot.getFile(photo.file_id);
        fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;
      } else {
        const f = msg.document || msg.video || msg.audio;
        const file = await bot.getFile(f.file_id);
        fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;
      }
      if (fileUrl) {
        content += `\n📎 ${fileUrl}`;
      }
    }

    // 🔹 Formato finale corretto
    const finalMessage = `Messaggio da Telegram\n**${tgName}**\n${content}`;

    // 🔹 Invia a Discord tramite webhook
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: tgName,       // nome Telegram per avatar
        avatar_url: avatarUrl,  // avatar Telegram
        content: finalMessage
      })
    });

  } catch (err) {
    console.error("❌ Errore Telegram → Discord:", err);
  }
});
