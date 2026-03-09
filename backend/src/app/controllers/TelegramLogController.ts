import { Request, Response } from 'express';
import { Controller } from './Controller';
import { db } from '../../config/database';
import { telegramLogs, users, devices, deviceUser, deviceSettings, sensorReadings } from '../models/schema';
import { eq, desc, sql } from 'drizzle-orm';
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

    // POST /api/telegram-logs/set-commands
    async setCommands(req: Request, res: Response) {
        try {
            const result = await TelegramService.setCommands();
            return this.sendResponse(res, result, 'Telegram commands set successfully');
        } catch (error: any) {
            console.error('Set Telegram Commands Error:', error);
            return this.sendError(res, 'Failed to set commands: ' + error.message);
        }
    }

    // POST /api/telegram/webhook (Public)
    async webhook(req: Request, res: Response) {
        try {
            console.log('Telegram Webhook Received:', req.body);

            const { message } = req.body;
            if (message) {
                const chatId = message.chat.id.toString();
                const text = (message.text || message.caption || '').trim();

                const user = await db.query.users.findFirst({
                    where: eq(users.telegramChatId, chatId)
                });

                // Log the incoming message
                await TelegramService.logAndEmit(
                    chatId,
                    user ? user.id : null,
                    text,
                    'received'
                );

                if (!user) {
                    await TelegramService.sendMessage(chatId, "❌ Your Telegram account is not linked to any user in the Insamo system. Please contact an admin.");
                    return res.json({ status: 'ok' });
                }

                // Handle /device command
                if (text === '/device') {
                    let userDevices;
                    
                    if (Number(user.roleId) === 1) {
                        // Superadmin sees all devices
                        userDevices = await db.select({
                            id: devices.id,
                            name: devices.name,
                            device_code: devices.device_code,
                            address: devices.address
                        })
                        .from(devices);
                    } else {
                        // Regular user sees only assigned devices
                        userDevices = await db.select({
                            id: devices.id,
                            name: devices.name,
                            device_code: devices.device_code,
                            address: devices.address
                        })
                        .from(deviceUser)
                        .innerJoin(devices, eq(deviceUser.device_id, devices.id))
                        .where(eq(deviceUser.user_id, Number(user.id)));
                    }

                    if (userDevices.length === 0) {
                        await TelegramService.sendMessage(chatId, "📂 No devices available.");
                    } else {
                        let response = "📱 *DEVICE LIST*\n\n";
                        for (const d of userDevices) {
                            // Check latest reading to determine online status
                            const latest = await db.query.sensorReadings.findFirst({
                                where: eq(sensorReadings.device_id, d.id),
                                orderBy: desc(sensorReadings.recorded_at)
                            });

                            const isOnline = latest && (new Date().getTime() - new Date(latest.recorded_at).getTime()) < 10 * 60 * 1000;
                            const statusEmoji = isOnline ? "🟢 ONLINE" : "🔴 OFFLINE";

                            response += `/device/${d.id}\n`;
                            response += `*${d.name}*\n`;
                            response += `_${d.device_code}_\n`;
                            response += `${d.address || 'No Address'}\n`;
                            response += `${statusEmoji}\n\n`;
                        }
                        await TelegramService.sendMessage(chatId, response);
                    }
                } 
                // Handle /device/[id] command
                else if (text.startsWith('/device/')) {
                    const deviceId = parseInt(text.split('/')[2]);
                    if (isNaN(deviceId)) {
                        await TelegramService.sendMessage(chatId, "⚠️ Invalid Device ID format.");
                    } else {
                        // Check if user has access to this device (Superadmin has access to everything)
                        let hasAccess = Number(user.roleId) === 1;
                        
                        if (!hasAccess) {
                            const access = await db.query.deviceUser.findFirst({
                                where: sql`${deviceUser.user_id} = ${Number(user.id)} AND ${deviceUser.device_id} = ${deviceId}`
                            });
                            hasAccess = !!access;
                        }

                        if (!hasAccess) {
                            await TelegramService.sendMessage(chatId, "🚫 You do not have permission to access this device.");
                        } else {
                            const device = await db.query.devices.findFirst({
                                where: eq(devices.id, deviceId)
                            });

                            const latest = await db.query.sensorReadings.findFirst({
                                where: eq(sensorReadings.device_id, deviceId),
                                orderBy: desc(sensorReadings.recorded_at)
                            });

                            const settings = await db.query.deviceSettings.findFirst({
                                where: eq(deviceSettings.device_id, deviceId)
                            });

                            if (!device) {
                                await TelegramService.sendMessage(chatId, "❓ Device not found.");
                            } else {
                                const isOnline = latest && (new Date().getTime() - new Date(latest.recorded_at).getTime()) < 10 * 60 * 1000;
                                const statusEmoji = isOnline ? "🟢 ONLINE" : "🔴 OFFLINE";
                                
                                let response = `📡 *DEVICE STATUS: ${device.name}*\n\n`;
                                response += `*Status:* ${statusEmoji}\n`;
                                
                                if (settings) {
                                    const calibration = settings.initial_distance - (latest?.water_level || 0);
                                    response += `*Calibration:* ${calibration > 0 ? '+' : ''}${calibration.toFixed(1)} cm\n`;
                                }

                                response += `*Coordinates:* ${device.latitude}, ${device.longitude}\n`;
                                
                                if (latest) {
                                    const timeDiff = Math.floor((new Date().getTime() - new Date(latest.recorded_at).getTime()) / 60000);
                                    response += `*Last Update:* ${timeDiff === 0 ? 'Just now' : `${timeDiff} min(s) ago`}\n\n`;
                                    
                                    response += `📊 *LATEST READINGS*\n`;
                                    if (device.device_type === 'FLOWS') {
                                        response += `🌊 Water Level: ${latest.water_level}m\n`;
                                        response += `🌡️ Temp: ${latest.temperature}°C\n`;
                                        response += `💨 Wind: ${latest.wind_speed}m/s\n`;
                                    } else if (device.device_type === 'LANDSLIDE') {
                                        response += `📉 Score: ${latest.landslide_score}\n`;
                                        response += `⚠️ Status: ${latest.landslide_status}\n`;
                                        response += `💧 Moisture: ${latest.soil_moisture}%\n`;
                                    } else if (device.device_type === 'SIGMA') {
                                        response += `📐 Tilt: ${latest.device_tilt}°\n`;
                                        response += `🫨 Magnitude: ${latest.magnitude}\n`;
                                    }
                                } else {
                                    response += `\n_No data points record yet._`;
                                }

                                await TelegramService.sendMessage(chatId, response);
                            }
                        }
                    }
                }
            }

            return res.json({ status: 'ok' });
        } catch (error: any) {
            console.error('Telegram Webhook Error:', error);
            return res.json({ status: 'error', message: error.message });
        }
    }
}

export default new TelegramLogController();
