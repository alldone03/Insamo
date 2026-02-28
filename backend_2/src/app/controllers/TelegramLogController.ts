import { Request, Response } from 'express';
import { Controller } from './Controller';
import { db } from '../../config/database';
import { telegramLogs, users } from '../models/schema';
import { eq, desc } from 'drizzle-orm';
import { TelegramService } from '../services/TelegramService';

export class TelegramLogController extends Controller {
    // GET /api/telegram-logs
    async index(req: Request, res: Response) {
        try {
            // Simple retrieval for now, following Laravel index() but adapted for drizzle
            // Laravel use: TelegramLog::with('user')->latest()->paginate(50);
            
            const logs = await db.select({
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
            .orderBy(desc(telegramLogs.createdAt))
            .limit(50);

            return this.sendResponse(res, logs, 'Telegram logs retrieved successfully');
        } catch (error: any) {
            console.error('Fetch Telegram Logs Error:', error);
            return this.sendError(res, 'Failed to fetch telegram logs');
        }
    }

    // DELETE /api/telegram-logs/:id
    async destroy(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await db.delete(telegramLogs).where(eq(telegramLogs.id, Number(id)));
            return this.sendResponse(res, null, 'Log deleted');
        } catch (error: any) {
            console.error('Delete Telegram Log Error:', error);
            return this.sendError(res, 'Failed to delete telegram log');
        }
    }

    // POST /api/telegram-logs/send-test
    async sendTest(req: Request, res: Response) {
        try {
            const { userId, message } = req.body;
            if (!userId) {
                return this.sendError(res, 'User ID is required', 400);
            }

            const user = await db.query.users.findFirst({
                where: eq(users.id, Number(userId))
            });

            if (!user) {
                return this.sendError(res, 'User not found', 404);
            }

            if (!user.telegramChatId) {
                return this.sendError(res, 'User does not have a Telegram Chat ID configured', 400);
            }

            await TelegramService.sendMessage(
                user.telegramChatId, 
                message || `Hello ${user.name}, this is a test message from the Insamo Control Center.`
            );

            return this.sendResponse(res, null, 'Test message sent successfully');
        } catch (error: any) {
            console.error('Send Test Telegram Message Error:', error);
            return this.sendError(res, 'Failed to send test message: ' + error.message);
        }
    }

    // POST /api/telegram-logs/set-webhook
    async setWebhook(req: Request, res: Response) {
        try {
            const { url } = req.body;
            if (!url) {
                return this.sendError(res, 'URL is required', 400);
            }

            const result = await TelegramService.setWebhook(url);
            return this.sendResponse(res, result, 'Webhook set successfully');
        } catch (error: any) {
            console.error('Set Telegram Webhook Error:', error);
            return this.sendError(res, 'Failed to set webhook: ' + error.message);
        }
    }

    // POST /api/telegram/webhook (Public)
    async webhook(req: Request, res: Response) {
        try {
            console.log('Telegram Webhook Received:', req.body);

            const { message } = req.body;
            if (message) {
                const chatId = message.chat.id.toString();
                const text = message.text || message.caption || '[Non-text message]';

                const user = await db.query.users.findFirst({
                    where: eq(users.telegramChatId, chatId)
                });

                await db.insert(telegramLogs).values({
                    chat_id: chatId,
                    user_id: user ? user.id : null,
                    message: text,
                    type: 'received'
                });
            }

            return res.json({ status: 'ok' });
        } catch (error: any) {
            console.error('Telegram Webhook Error:', error);
            return res.json({ status: 'error', message: error.message });
        }
    }
}

export default new TelegramLogController();
