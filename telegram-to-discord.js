import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";

console.log("🚀 Deploy Telegram → Discord (avatar)");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

if (!TELEGRAM_TOKEN || !DISCORD_WEBHOOK_URL) {
  console.error("❌ Variabili ambiente mancanti");
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

console.log("🤖 Telegram bot avviato");

bot.on("message", async (msg) => {
  try {
    if (msg.from?.is_bot) return;

    const name = msg.from.first_name || "Utente";
    let avatarUrl = null;

    // 🖼️ PRENDI AVATAR TELEGRAM
    const photos = await bot.getUserProfilePhotos(msg.from.id, { limit: 1 });
    if (photos.total_count > 0) {
      const photo = photos.photos[0][photos.photos[0].length - 1];
      const file = await bot.getFile(photo.file_id);
      avatarUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;
    }

    let content = "";

    // 🔁 REPLY (citazione)
    if (msg.reply_to_message) {
      const r = msg.reply_to_message;
      const rName = r.from?.first_name || "Utente";
      const rText = r.text || r.caption || "[media]";
      content += `> **${rName}**: ${rText}\n\n`;
    }

    // 📝 TESTO
    if (msg.text) {
      content += msg.text;
    }

    // 📸 FOTO
    if (msg.photo) {
      const photo = msg.photo[msg.photo.length - 1];
      const file = await bot.getFile(photo.file_id);
      const imageUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;

      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          avatar_url: avatarUrl,
          content: content || "",
          embeds: [
            {
              image: { url: imageUrl }
            }
          ]
        })
      });
      return;
    }

    // 📎 FILE (pdf, video, audio, zip…)
    if (msg.document || msg.video || msg.audio) {
      const f = msg.document || msg.video || msg.audio;
      const file = await bot.getFile(f.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;

      content += `\n📎 ${fileUrl}`;
    }

    // INVIO FINALE
    if (content) {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          avatar_url: avatarUrl,
          content
        })
      });
    }

  } catch (err) {
    console.error("❌ Errore Telegram → Discord:", err);
  }
});
