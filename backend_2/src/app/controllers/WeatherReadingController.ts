import { Request, Response } from 'express';
import { Controller } from './Controller';
import { db } from '../../config/database';
import { weatherReadings } from '../models/schema';
import { desc, eq } from 'drizzle-orm';

export class WeatherReadingController extends Controller {
  async index(req: Request, res: Response) {
    try {
      const results = await db.select().from(weatherReadings).orderBy(desc(weatherReadings.recorded_at)).limit(50);
      return this.sendResponse(res, results, 'Weather readings retrieved successfully');
    } catch (error: any) {
      return this.sendError(res, 'Failed to fetch weather readings');
    }
  }

  async store(req: Request, res: Response) {
    try {
      const { temperature, humidity, pressure, wind_speed, recorded_at } = req.body;
      
      const result = await db.insert(weatherReadings).values({
        temperature: Number(temperature),
        humidity: Number(humidity),
        pressure: Number(pressure),
        wind_speed: Number(wind_speed),
        recorded_at: new Date(recorded_at),
      });

      return this.sendResponse(res, result, 'Weather reading stored successfully', 201);
    } catch (error: any) {
      return this.sendError(res, 'Failed to store weather reading');
    }
  }

  async latest(req: Request, res: Response) {
    try {
      const result = await db.select().from(weatherReadings).orderBy(desc(weatherReadings.recorded_at)).limit(1);
      
      if (!result.length) {
        return this.sendError(res, 'No weather readings found', 404);
      }

      return this.sendResponse(res, result[0], 'Latest weather reading retrieved successfully');
    } catch (error: any) {
      return this.sendError(res, 'Failed to fetch latest weather reading');
    }
  }
}

export default new WeatherReadingController();
