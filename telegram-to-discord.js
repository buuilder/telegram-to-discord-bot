import { Client, GatewayIntentBits } from "discord.js";
import TelegramBot from "node-telegram-bot-api";

// ===== RIGA INNOCUA (per trigger deploy) =====
console.log("🚀 Deploy Telegram → Discord");

// ===== VARIABILI =====
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

if (!DISCORD_TOKEN || !DISCORD_CHANNEL_ID || !TELEGRAM_TOKEN) {
  console.error("❌ Variabili ambiente mancanti");
  process.exit(1);
}

// ===== DISCORD =====
const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds]
});

discordClient.once("ready", () => {
  console.log(`🤖 Discord connesso come ${discordClient.user.tag}`);
});

// ===== TELEGRAM =====
const telegramBot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
console.log("🤖 Telegram bot avviato");

// ===== TELEGRAM → DISCORD =====
telegramBot.on("message", async (msg) => {
  try {
    if (msg.from?.is_bot) return;

    const channel = await discordClient.channels.fetch(DISCORD_CHANNEL_ID);
    if (!channel) return;

    const name = msg.from.first_name || "Utente";

    // 📸 FOTO
    if (msg.photo) {
      const photo = msg.photo[msg.photo.length - 1];
      const file = await telegramBot.getFile(photo.file_id);
      const url = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;

      await channel.send({
        content: `**${name}**\n${msg.caption || ""}`,
        files: [url]
      });
      return;
    }

    // 📎 FILE
    if (msg.document || msg.video || msg.audio) {
      const fileData = msg.document || msg.video || msg.audio;
      const file = await telegramBot.getFile(fileData.file_id);
      const url = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;

      await channel.send({
        content: `**${name}**\n${msg.caption || ""}`,
        files: [url]
      });
      return;
    }

    // 📝 TESTO
    if (msg.text) {
      await channel.send(`**${name}**\n${msg.text}`);
    }

  } catch (err) {
    console.error("❌ Errore Telegram → Discord:", err);
  }
});

// ===== LOGIN =====
discordClient.login(DISCORD_TOKEN);
