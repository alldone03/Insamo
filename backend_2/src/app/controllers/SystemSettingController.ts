import { Request, Response } from 'express';
import { Controller } from './Controller';
import { db } from '../../config/database';
import { systemSettings } from '../models/schema';
import { eq, inArray } from 'drizzle-orm';

export class SystemSettingController extends Controller {
    // GET /api/system-settings
    async index(req: Request, res: Response) {
        try {
            const settings = await db.select().from(systemSettings);
            return this.sendResponse(res, settings, 'System settings retrieved successfully');
        } catch (error: any) {
            console.error('Fetch System Settings Error:', error);
            return this.sendError(res, 'Failed to fetch system settings');
        }
    }

    // POST /api/system-settings/:key
    async update(req: Request, res: Response) {
        try {
            const key = req.params.key as string;
            const { value } = req.body;

            const [existing] = await db.select()
                .from(systemSettings)
                .where(eq(systemSettings.key, key))
                .limit(1);

            if (!existing) {
                await db.insert(systemSettings).values({
                    key: key,
                    value: String(value)
                });
            } else {
                await db.update(systemSettings)
                    .set({ value: String(value) })
                    .where(eq(systemSettings.key, key));
            }

            const [updated] = await db.select()
                .from(systemSettings)
                .where(eq(systemSettings.key, key))
                .limit(1);

            return this.sendResponse(res, updated, 'System setting updated successfully');
        } catch (error: any) {
            console.error('Update System Setting Error:', error);
            return this.sendError(res, 'Failed to update system setting');
        }
    }

    // POST /api/system-settings/get-many
    async getMany(req: Request, res: Response) {
        try {
            const { keys } = req.body;
            if (!keys || !Array.isArray(keys)) {
                return this.sendError(res, 'Keys must be an array', 400);
            }

            const settings = await db.select()
                .from(systemSettings)
                .where(inArray(systemSettings.key, keys));

            return this.sendResponse(res, settings, 'System settings retrieved successfully');
        } catch (error: any) {
            console.error('Get Many System Settings Error:', error);
            return this.sendError(res, 'Failed to fetch settings');
        }
    }
}

export default new SystemSettingController();
