import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import TelegramBot from "node-telegram-bot-api";

// Variabili ambiente
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Bot Telegram
const telegramBot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

client.once("ready", () => {
  console.log(`🤖 Discord pronto come ${client.user.tag}`);
});

// Inoltra i messaggi da Telegram a Discord
telegramBot.on("message", async (msg) => {
  if (!msg.text) return; // ignora messaggi vuoti

  const discordChannel = await client.channels.fetch(DISCORD_CHANNEL_ID);
  if (!discordChannel || !(discordChannel instanceof TextChannel)) return;

  const text = `**${msg.from.first_name}**\n${msg.text}`; // grassetto + a capo

  try {
    discordChannel.send(text);
  } catch (err) {
    console.error("Errore invio Discord:", err);
  }
});

client.login(DISCORD_TOKEN);
