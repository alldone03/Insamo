import { Request, Response } from 'express';
import { Controller } from './Controller';
import { db } from '../../config/database';
import { classificationResults } from '../models/schema';
import { eq, desc } from 'drizzle-orm';

export class ClassificationResultController extends Controller {
  async index(req: Request, res: Response) {
    try {
      const { device_id } = req.query;
      let query = db.select().from(classificationResults);

      if (device_id) {
        query = query.where(eq(classificationResults.device_id, Number(device_id))) as any;
      }

      const results = await query.orderBy(desc(classificationResults.created_at)).limit(50);
      return this.sendResponse(res, results, 'Classification results retrieved successfully');
    } catch (error: any) {
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
