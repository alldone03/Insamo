import { Request, Response } from 'express';
import { Controller } from './Controller';
import { db } from '../../config/database';
import { classificationResults, deviceUser } from '../models/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';

export class ClassificationResultController extends Controller {
  async index(req: Request, res: Response) {
    try {
      const { device_id } = req.query;
      const user = (req as any).user;
      
      let conditions: any[] = [];

      if (user.roleId !== 1) {
          if (device_id) {
              const access = await db.select().from(deviceUser)
                  .where(and(eq(deviceUser.user_id, user.id), eq(deviceUser.device_id, Number(device_id))))
                  .limit(1);
              if (!access.length) {
                  return this.sendError(res, 'Access denied to this device data', 403);
              }
              conditions.push(eq(classificationResults.device_id, Number(device_id)));
          } else {
              const userDevices = await db.select({ id: deviceUser.device_id }).from(deviceUser).where(eq(deviceUser.user_id, user.id));
              const deviceIds = userDevices.map(d => d.id).filter((id): id is number => id !== null);
              if (deviceIds.length > 0) {
                  conditions.push(inArray(classificationResults.device_id, deviceIds));
              } else {
                  return this.sendResponse(res, [], 'No devices assigned');
              }
          }
      } else if (device_id) {
          conditions.push(eq(classificationResults.device_id, Number(device_id)));
      }

      const results = await db.select()
        .from(classificationResults)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(classificationResults.created_at))
        .limit(50);

      return this.sendResponse(res, results, 'Classification results retrieved successfully');
    } catch (error: any) {
      console.error('Classification Index Error:', error);
      return this.sendError(res, 'Failed to fetch classification results');
    }
  }

  async store(req: Request, res: Response) {
    try {
      const { device_id, sensor_reading_id, label, confidence } = req.body;
      
      const result = await db.insert(classificationResults).values({
        device_id: Number(device_id),
        sensor_reading_id: sensor_reading_id ? Number(sensor_reading_id) : null,
        label,
        confidence: Number(confidence),
      });

      return this.sendResponse(res, result, 'Classification result stored successfully', 201);
    } catch (error: any) {
      return this.sendError(res, 'Failed to store classification result');
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await db.select().from(classificationResults).where(eq(classificationResults.id, Number(id))).limit(1);
      
      if (!result.length) {
        return this.sendError(res, 'Classification result not found', 404);
      }

      return this.sendResponse(res, result[0], 'Classification result retrieved successfully');
    } catch (error: any) {
      return this.sendError(res, 'Failed to fetch classification result');
    }
  }
}

export default new ClassificationResultController();
