// Discord Notification Snippet
import discordBot from '../src/server/discord-bot';

export function notifyDiscord(message: string) {
  discordBot.notifyEvent(message).catch(console.error);
}
