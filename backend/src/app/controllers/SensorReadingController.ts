import { Request, Response } from 'express';
import { Controller } from './Controller';
import { db } from '../../config/database';
import { redis } from '../../config/redis';
import { sensorReadings, devices, deviceSettings, classificationResults, deviceUser } from '../models/schema';
import { eq, desc, and, gte, lte, inArray } from 'drizzle-orm';
import { TelegramService } from '../services/TelegramService';
import { io } from '../../index';

export class SensorReadingController extends Controller {
  async index(req: Request, res: Response) {
      try {
          const { device_id, start_date, end_date, per_page } = req.query;
          
          let conditions: any[] = [];
          const user = (req as any).user;
          
          if (user.roleId !== 1) {
              if (device_id) {
                  const access = await db.select().from(deviceUser)
                      .where(and(eq(deviceUser.user_id, user.id), eq(deviceUser.device_id, Number(device_id))))
                      .limit(1);
                  if (!access.length) {
                      return this.sendError(res, 'Access denied to this device sensor data', 403);
                  }
                  conditions.push(eq(sensorReadings.device_id, Number(device_id)));
              } else {
                  const userDevices = await db.select({ id: deviceUser.device_id }).from(deviceUser).where(eq(deviceUser.user_id, user.id));
                  const deviceIds = userDevices.map(d => d.id).filter((id): id is number => id !== null);
                  if (deviceIds.length > 0) {
                      conditions.push(inArray(sensorReadings.device_id, deviceIds));
                  } else {
                      return this.sendResponse(res, {
                          data: [],
                          per_page: Number(per_page) || 50,
                          current_page: 1
                      }, 'No devices assigned');
                  }
              }
          } else if (device_id) {
              conditions.push(eq(sensorReadings.device_id, Number(device_id)));
          }

          if (start_date) {
              conditions.push(gte(sensorReadings.recorded_at, new Date(start_date as string)));
          }

          if (end_date) {
              conditions.push(lte(sensorReadings.recorded_at, new Date(end_date as string)));
          }

          const limitNum = per_page ? Number(per_page) : 50;

          // Build query base
          const query = db.select()
            .from(sensorReadings)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(sensorReadings.recorded_at))
            .limit(limitNum);

          const readings = await query;
          
          // Eager load classificationResults manually
          const augmentedReadings = await Promise.all(readings.map(async (reading) => {
              const currentResult = await db.select()
                .from(classificationResults)
                .where(eq(classificationResults.sensor_reading_id, reading.id));
              
              return {
                  ...reading,
                  classificationResults: currentResult
              };
          }));

          // Paginated response style
          return this.sendResponse(res, {
              data: augmentedReadings,
              per_page: limitNum,
              current_page: 1 // Simulation of pagination metadata since drizzle manual
          }, 'Sensor readings retrieved successfully');
          
      } catch (error: any) {
          console.error('Fetch Sensor Readings Error:', error);
          return this.sendError(res, 'Failed to fetch readings');
      }
  }

  async store(req: Request, res: Response) {
    try {
      const { device_code, recorded_at, ...data } = req.body;
      
      if (!device_code) {
          return this.sendError(res, 'Validation error: device_code required', 400);
      }

      // Lookup device by code
      const deviceRecords = await db.select().from(devices).where(eq(devices.device_code, device_code)).limit(1);
      
      if (!deviceRecords.length) {
        return this.sendError(res, 'Device not found', 404);
      }
      
      const device = deviceRecords[0];

      // Insert sensor reading
      const [insertResult] = await db.insert(sensorReadings).values({
        device_id: device.id,
        recorded_at: recorded_at ? new Date(recorded_at) : new Date(),
        temperature: data.temperature ? Number(data.temperature) : null,
        humidity: data.humidity ? Number(data.humidity) : null,
        wind_speed: data.wind_speed ? Number(data.wind_speed) : null,
        water_level: data.water_level ? Number(data.water_level) : null,
        tilt_x: data.tilt_x ? Number(data.tilt_x) : null,
        tilt_y: data.tilt_y ? Number(data.tilt_y) : null,
        tilt_z: data.tilt_z ? Number(data.tilt_z) : null,
        magnitude: data.magnitude ? Number(data.magnitude) : null,
        landslide_score: data.landslide_score ? Number(data.landslide_score) : null,
        landslide_status: data.landslide_status,
        soil_moisture: data.soil_moisture ? Number(data.soil_moisture) : null,
        vib_x: data.vib_x ? Number(data.vib_x) : null,
        vib_y: data.vib_y ? Number(data.vib_y) : null,
        vib_z: data.vib_z ? Number(data.vib_z) : null,
        gyro_x: data.gyro_x ? Number(data.gyro_x) : null,
        gyro_y: data.gyro_y ? Number(data.gyro_y) : null,
        gyro_z: data.gyro_z ? Number(data.gyro_z) : null,
        rainfall_intensity: data.rainfall_intensity ? Number(data.rainfall_intensity) : null,
        device_tilt: data.device_tilt ? Number(data.device_tilt) : null,
      });

      const readingResult = await db.select().from(sensorReadings).where(eq(sensorReadings.id, Number(insertResult.insertId))).limit(1);
      const reading = readingResult[0];

      // Cache latest reading to Redis
      try {
          await redis.set(`device:${device.id}:latest_reading`, JSON.stringify(reading));
      } catch (err) {
          console.error('Failed to cache reading to Redis:', err);
      }

      // Alert Logic for Flood (FLOWS)
      if (device.device_type === 'FLOWS' && typeof data.water_level !== 'undefined') {
          // fetch setting
          const settingRecords = await db.select().from(deviceSettings).where(eq(deviceSettings.device_id, device.id)).limit(1);
          if (settingRecords.length > 0) {
              const settings = settingRecords[0];
              const level = Number(data.water_level);
              let status = 'NORMAL';
              let threshold = settings.initial_distance;

              if (level >= settings.danger_threshold) {
                  status = 'DANGER';
                  threshold = settings.danger_threshold;
              } else if (level >= settings.alert_threshold) {
                  status = 'ALERT';
                  threshold = settings.alert_threshold;
              }

              if (status !== 'NORMAL') {
                  const alertDeviceObj = {
                      id: device.id,
                      name: device.name,
                      address: device.address
                  };

                  await TelegramService.sendFloodAlert(alertDeviceObj, status, level, threshold);
              }
          }
      }

      // Emit real-time update
      io.emit('new_sensor_reading', { device_id: device.id, reading: reading, device_type: device.device_type });

      return this.sendResponse(res, reading, 'Sensor reading stored successfully', 201);
    } catch (error: any) {
      console.error('Store reading error:', error);
      return this.sendError(res, 'Failed to store sensor reading: ' + error.message);
    }
  }

  async show(req: Request, res: Response) {
      try {
          const { id } = req.params;
          const readingResult = await db.select().from(sensorReadings).where(eq(sensorReadings.id, Number(id))).limit(1);
          
          if (!readingResult.length) {
              return this.sendError(res, 'Sensor reading not found', 404);
          }

          const reading = readingResult[0] as any;

          // Load classification results matching show
          const classifications = await db.select()
            .from(classificationResults)
            .where(eq(classificationResults.sensor_reading_id, reading.id));

          reading.classificationResults = classifications;

          return this.sendResponse(res, reading, 'Sensor reading retrieved successfully');
      } catch (error: any) {
          return this.sendError(res, 'Failed to fetch sensor reading');
      }
  }
}

export default new SensorReadingController();
