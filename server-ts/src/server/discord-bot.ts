// AI MEMORY ANCHOR: See docs/ROADMAP.md and docs/MEMORIES.md for project goals and persistent AI context.
// Discord Bot Integration for RuneRogue
// This service connects a Discord bot for notifications and commands.

import { Client, GatewayIntentBits, TextChannel, Events } from 'discord.js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID; // Target channel for notifications
const DISCORD_NOTIFICATION_CHANNEL_ID = process.env.DISCORD_NOTIFICATION_CHANNEL_ID;

export const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

export async function startDiscordBot() {
  if (!DISCORD_BOT_TOKEN) {
    console.warn('DISCORD_BOT_TOKEN not set. Discord bot will not start.');
    return;
  }
  await discordClient.login(DISCORD_BOT_TOKEN);
  console.log('Discord bot logged in.');
}

discordClient.once(Events.ClientReady, () => {
  console.log(`Discord bot ready as ${discordClient.user?.tag}`);
});

// Example: Send a notification to the configured channel
export async function sendDiscordNotification(message: string) {
  if (!DISCORD_CHANNEL_ID) return;
  const channel = await discordClient.channels.fetch(DISCORD_CHANNEL_ID);
  if (channel && channel.isTextBased()) {
    (channel as TextChannel).send(message);
  }
}

export function notifyEvent(message: string): void {
  const channelId = DISCORD_NOTIFICATION_CHANNEL_ID;
  if (!channelId) {
    console.error('DISCORD_NOTIFICATION_CHANNEL_ID not set in environment variables');
    return;
  }
  const channel = discordClient.channels.cache.get(channelId) as TextChannel;
  if (!channel) {
    console.error(`Channel with ID ${channelId} not found`);
    return;
  }
  channel.send(message).catch(err => {
    console.error('Error sending Discord notification:', err);
  });
}

// Command handler for !stats <player>
discordClient.on(Events.MessageCreate, msg => {
  if (msg.content.startsWith('!stats')) {
    const parts = msg.content.split(' ');
    const playerName = parts[1] || 'unknown';
    // TODO: Integrate with game server for real stats
    msg.reply(`Stats for ${playerName}: Level 42, 100 HP, 1,337 gold. (Mock data)`);
  }
});

// --- Express endpoint for automation notifications ---
import express from 'express';

const NOTIFY_PORT = parseInt(process.env.DISCORD_BOT_NOTIFY_PORT || '4001', 10);
const NOTIFY_SECRET = process.env.DISCORD_BOT_NOTIFY_SECRET;

const app = express();
app.use(express.json());

app.post('/notify', async (req, res) => {
  // Optional: Require secret header for security
  if (NOTIFY_SECRET && req.headers['x-notify-secret'] !== NOTIFY_SECRET) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Missing message' });
    return;
  }
  try {
    await sendDiscordNotification(message);
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to send notification', details: (e as Error).message });
  }
});

// Only start server if this file is run directly (not when imported)
if (require.main === module) {
  startDiscordBot();
  app.listen(NOTIFY_PORT, () => {
    console.log(`[discord-bot] Notification endpoint listening on port ${NOTIFY_PORT}`);
  });
}
