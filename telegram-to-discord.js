import { Client, GatewayIntentBits } from "discord.js";
import TelegramBot from "node-telegram-bot-api";

console.log("🚀 Deploy Telegram → Discord");

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

if (!DISCORD_TOKEN || !DISCORD_CHANNEL_ID || !TELEGRAM_TOKEN) {
  console.error("❌ Variabili ambiente mancanti");
  process.exit(1);
}

const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds]
});

discordClient.once("ready", () => {
  console.log(`🤖 Discord connesso come ${discordClient.user.tag}`);
});

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  try {
    if (msg.from?.is_bot) return;

    const channel = await discordClient.channels.fetch(DISCORD_CHANNEL_ID);
    if (!channel) return;

    const name = msg.from.first_name || "Utente";
    let replyText = "";

    // 🔁 SE È UNA RISPOSTA
    if (msg.reply_to_message) {
      const r = msg.reply_to_message;
      const rName = r.from?.first_name || "Utente";
      const rText = r.text || r.caption || "[media]";
      replyText = `↪️ In risposta a:\n${rName}: ${rText}\n\n`;
    }

    // FOTO
    if (msg.photo) {
      const photo = msg.photo[msg.photo.length - 1];
      const file = await bot.getFile(photo.file_id);
      const url = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;

      await channel.send({
        content: `${replyText}**${name}**\n${msg.caption || ""}`,
        files: [url]
      });
      return;
    }

    // FILE
    if (msg.document || msg.video || msg.audio) {
      const f = msg.document || msg.video || msg.audio;
      const file = await bot.getFile(f.file_id);
      const url = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;

      await channel.send({
        content: `${replyText}**${name}**\n${msg.caption || ""}`,
        files: [url]
      });
      return;
    }

    // TESTO
    if (msg.text) {
      await channel.send(`${replyText}**${name}**\n${msg.text}`);
    }

  } catch (err) {
    console.error("Errore Telegram → Discord:", err);
  }
});

discordClient.login(DISCORD_TOKEN);
