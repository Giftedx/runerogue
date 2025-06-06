// AI MEMORY ANCHOR: See docs/ROADMAP.md and docs/MEMORIES.md for project goals and persistent AI context.
// Discord Bot Integration for RuneRogue
// This service connects a Discord bot for notifications and commands.

import { Client, GatewayIntentBits, TextChannel, Events, EmbedBuilder, ColorResolvable } from 'discord.js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID; // Target channel for notifications
const DISCORD_NOTIFICATION_CHANNEL_ID = process.env.DISCORD_NOTIFICATION_CHANNEL_ID;

export const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
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

// Enhanced notification with embeds for game events
export async function sendGameEventNotification(eventType: string, data: any): Promise<void> {
  const channelId = DISCORD_NOTIFICATION_CHANNEL_ID || DISCORD_CHANNEL_ID;
  if (!channelId) {
    console.error('No Discord channel configured for notifications');
    return;
  }
  
  try {
    const channel = await discordClient.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) return;
    
    const embed = new EmbedBuilder()
      .setTimestamp()
      .setFooter({ text: 'RuneRogue' });
    
    switch (eventType) {
      case 'player_death':
        embed
          .setTitle('☠️ Player Death')
          .setDescription(`**${data.killedBy}** has slain **${data.playerName}**!`)
          .setColor('#FF0000' as ColorResolvable)
          .addFields(
            { name: 'Location', value: `(${data.x}, ${data.y})`, inline: true },
            { name: 'Combat Level', value: `${data.combatLevel}`, inline: true }
          );
        break;
        
      case 'rare_drop':
        embed
          .setTitle('🎉 Rare Drop!')
          .setDescription(`**${data.playerName}** received a rare drop!`)
          .setColor('#FFD700' as ColorResolvable)
          .addFields(
            { name: 'Item', value: data.itemName, inline: true },
            { name: 'From', value: data.source, inline: true },
            { name: 'Rarity', value: `1/${data.dropRate}`, inline: true }
          );
        break;
        
      case 'trade_completed':
        embed
          .setTitle('🤝 Trade Completed')
          .setDescription(`Trade between **${data.player1}** and **${data.player2}** completed!`)
          .setColor('#00FF00' as ColorResolvable)
          .addFields(
            { name: `${data.player1} gave`, value: data.player1Items || 'Nothing', inline: true },
            { name: `${data.player2} gave`, value: data.player2Items || 'Nothing', inline: true }
          );
        break;
        
      case 'boss_spawn':
        embed
          .setTitle('⚔️ Boss Spawned!')
          .setDescription(`**${data.bossName}** has appeared!`)
          .setColor('#9B59B6' as ColorResolvable)
          .addFields(
            { name: 'Location', value: `${data.location}`, inline: true },
            { name: 'Combat Level', value: `${data.combatLevel}`, inline: true }
          );
        break;
        
      case 'achievement':
        embed
          .setTitle('🏆 Achievement Unlocked!')
          .setDescription(`**${data.playerName}** earned an achievement!`)
          .setColor('#3498DB' as ColorResolvable)
          .addFields(
            { name: 'Achievement', value: data.achievementName, inline: true },
            { name: 'Points', value: `${data.points}`, inline: true }
          );
        break;
        
      default:
        embed
          .setTitle('📢 Game Event')
          .setDescription(data.message || 'Something happened in RuneRogue!')
          .setColor('#95A5A6' as ColorResolvable);
    }
    
    (channel as TextChannel).send({ embeds: [embed] });
  } catch (error) {
    console.error('Error sending Discord game event notification:', error);
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

// Enhanced command handler with more game commands
discordClient.on(Events.MessageCreate, async msg => {
  if (msg.author.bot) return;
  
  const args = msg.content.split(' ');
  const command = args[0].toLowerCase();
  
  switch (command) {
    case '!stats':
      const playerName = args[1] || 'unknown';
      // Get real stats from persistence
      try {
        const { playerPersistence } = await import('./persistence/PlayerPersistence.js');
        const playerData = await playerPersistence.loadPlayer(playerName);
        
        if (playerData) {
          const totalLevel = Object.values(playerData.skills).reduce((sum: number, skill: any) => sum + skill.level, 0);
          const totalXP = Object.values(playerData.skills).reduce((sum: number, skill: any) => sum + skill.experience, 0);
          
          const statsEmbed = new EmbedBuilder()
            .setTitle(`📊 ${playerData.username}'s Stats`)
            .setColor('#00FF00' as ColorResolvable)
            .addFields(
              { name: 'Combat Level', value: `${playerData.combatLevel}`, inline: true },
              { name: 'Total Level', value: `${totalLevel}`, inline: true },
              { name: 'Total XP', value: `${totalXP.toLocaleString()}`, inline: true },
              { name: 'Health', value: `${playerData.health}/${playerData.maxHealth}`, inline: true },
              { name: 'Last Seen', value: new Date(playerData.lastSeen).toLocaleString(), inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'RuneRogue Stats' });
          
          msg.reply({ embeds: [statsEmbed] });
        } else {
          msg.reply(`No player found with name: ${playerName}`);
        }
      } catch (error) {
        msg.reply(`Error loading stats for ${playerName}`);
      }
      break;
      
    case '!online':
      // Get real player count from game state
      try {
        const gameRooms = (globalThis as any).gameRooms || [];
        let totalPlayers = 0;
        gameRooms.forEach(room => {
          totalPlayers += room.state?.players?.size || 0;
        });
        
        msg.reply(`Currently ${totalPlayers} players online across ${gameRooms.length} game rooms.`);
      } catch (error) {
        msg.reply('Unable to fetch online player count.');
      }
      break;
      
    case '!leaderboard':
      // Fetch real leaderboard from persistence
      try {
        const { playerPersistence } = await import('./persistence/PlayerPersistence.js');
        const allStats = await playerPersistence.getAllPlayerStats();
        
        const top10 = allStats.slice(0, 10);
        
        const leaderboardEmbed = new EmbedBuilder()
          .setTitle('🏆 RuneRogue Leaderboard')
          .setColor('#FFD700' as ColorResolvable)
          .setTimestamp()
          .setFooter({ text: 'Top players by total XP' });
        
        top10.forEach((player, index) => {
          leaderboardEmbed.addFields({
            name: `${index + 1}. ${player.username}`,
            value: `Level ${player.combatLevel} | ${player.totalLevel} Total | ${player.totalXP.toLocaleString()} XP`,
            inline: false
          });
        });
        
        if (top10.length === 0) {
          leaderboardEmbed.setDescription('No players yet!');
        }
        
        msg.reply({ embeds: [leaderboardEmbed] });
      } catch (error) {
        msg.reply('Error fetching leaderboard data.');
      }
      break;
      
    case '!help':
      const helpEmbed = new EmbedBuilder()
        .setTitle('RuneRogue Bot Commands')
        .setColor('#3498DB' as ColorResolvable)
        .addFields(
          { name: '!stats [player]', value: 'View player statistics', inline: false },
          { name: '!online', value: 'Show online player count', inline: false },
          { name: '!leaderboard', value: 'View top players', inline: false },
          { name: '!drops [npc]', value: 'View NPC drop table', inline: false },
          { name: '!wiki [item]', value: 'Get item information', inline: false }
        )
        .setFooter({ text: 'RuneRogue Discord Bot' });
      msg.reply({ embeds: [helpEmbed] });
      break;
      
    case '!drops':
      const npcName = args.slice(1).join(' ') || 'goblin';
      // TODO: Fetch real drop tables
      msg.reply(`Drop table for ${npcName}: Bronze sword (50%), Bronze plate (25%), Coins (100%)`);
      break;
      
    case '!wiki':
      const itemName = args.slice(1).join(' ') || 'bronze sword';
      // TODO: Fetch real item data
      msg.reply(`**${itemName}**: Attack +7, Strength +6, Speed 4. A basic bronze weapon.`);
      break;
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

// Enhanced endpoint for game event notifications
app.post('/game-event', async (req, res) => {
  if (NOTIFY_SECRET && req.headers['x-notify-secret'] !== NOTIFY_SECRET) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  
  const { eventType, data } = req.body;
  if (!eventType || !data) {
    res.status(400).json({ error: 'Missing eventType or data' });
    return;
  }
  
  try {
    await sendGameEventNotification(eventType, data);
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to send game event notification', details: (e as Error).message });
  }
});

// Only start server if this file is run directly (not when imported)
if (require.main === module) {
  startDiscordBot();
  app.listen(NOTIFY_PORT, () => {
    console.log(`[discord-bot] Notification endpoint listening on port ${NOTIFY_PORT}`);
  });
}
