import { db } from '../../config/database';
import { systemSettings, telegramLogs, users, deviceUser } from '../models/schema';
import { eq } from 'drizzle-orm';

export class TelegramService {
  static async logAndEmit(chatId: string, userId: number | null, message: string, type: 'sent' | 'received') {
    try {
      const inserted = await db.insert(telegramLogs).values({
        chat_id: chatId,
        user_id: userId,
        message: message,
        type: type
      });

      const logId = (inserted as any)[0].insertId;
      const newLog = await db.select({
        id: telegramLogs.id,
        chatId: telegramLogs.chat_id,
        message: telegramLogs.message,
        type: telegramLogs.type,
        createdAt: telegramLogs.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(telegramLogs)
      .leftJoin(users, eq(telegramLogs.user_id, users.id))
      .where(eq(telegramLogs.id, logId))
      .limit(1);

      if (newLog.length > 0) {
        const { io } = await import('../../index');
        io.emit('telegram-log', newLog[0]);
      }
      return newLog[0];
    } catch (error: any) {
      console.error('Failed to log and emit telegram message:', error.message);
    }
  }

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
        await this.logAndEmit(chatId, user.length > 0 ? user[0].id : null, message, 'sent');
      }
    } catch (error: any) {
      console.error('Failed to send Telegram message:', error.message);
    }
  }

  static async setWebhook(url: string) {
    try {
      const tokenSetting = await db.select().from(systemSettings).where(eq(systemSettings.key, 'telegram_bot_token')).limit(1);
      const token = tokenSetting.length > 0 ? tokenSetting[0].value : null;

      if (!token || token === 'YOUR_BOT_TOKEN') {
        throw new Error('Telegram bot token not configured.');
      }

      const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${url}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.description || 'Failed to set webhook');
      }

      return result;
    } catch (error: any) {
      console.error('Failed to set Telegram webhook:', error.message);
      throw error;
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
