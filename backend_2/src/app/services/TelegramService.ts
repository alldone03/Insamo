import { db } from '../../config/database';
import { systemSettings, telegramLogs, users, deviceUser } from '../models/schema';
import { eq } from 'drizzle-orm';

export class TelegramService {
  static async sendMessage(chatId: string, message: string) {
    try {
      const tokenSetting = await db.select().from(systemSettings).where(eq(systemSettings.key, 'telegram_bot_token')).limit(1);
      const token = tokenSetting.length > 0 ? tokenSetting[0].value : null;

      if (!token || token === 'YOUR_BOT_TOKEN') {
        console.warn('Telegram bot token not configured.');
        return;
      }

      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      if (response.ok) {
        const user = await db.select().from(users).where(eq(users.telegramChatId, chatId)).limit(1);
        
        await db.insert(telegramLogs).values({
          chat_id: chatId,
          user_id: user.length > 0 ? user[0].id : null,
          message: message,
          type: 'sent'
        });
      }
    } catch (error: any) {
      console.error('Failed to send Telegram message:', error.message);
    }
  }

  static async sendFloodAlert(device: any, status: string, waterLevel: number, threshold: number) {
      try {
          const templateSetting = await db.select().from(systemSettings).where(eq(systemSettings.key, 'flood_alert_template')).limit(1);
          let template = templateSetting.length > 0 ? templateSetting[0].value : "🚨 *FLOOD ALERT* 🚨\nDevice: {device_name}\nStatus: {status}\nWater Level: {water_level}m\nThreshold: {threshold}m\nLocation: {location}";

          if (!template) {
                template = "🚨 *FLOOD ALERT* 🚨\nDevice: {device_name}\nStatus: {status}\nWater Level: {water_level}m\nThreshold: {threshold}m\nLocation: {location}";
          }

          let message = template
              .replace('{device_name}', device.name)
              .replace('{status}', status)
              .replace('{water_level}', waterLevel.toString())
              .replace('{threshold}', threshold.toString())
              .replace('{location}', device.address || 'Unknown Location');

          // Find users attached to this device
          const attachedUsers = await db.select({
              telegramChatId: users.telegramChatId
          })
          .from(deviceUser)
          .innerJoin(users, eq(deviceUser.user_id, users.id))
          .where(eq(deviceUser.device_id, device.id));

          for (const user of attachedUsers) {
              if (user.telegramChatId) {
                  await this.sendMessage(user.telegramChatId, message);
              }
          }
      } catch (error: any) {
          console.error("Failed to process flood alert:", error.message);
      }
  }
}
