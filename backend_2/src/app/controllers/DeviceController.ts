import { Request, Response } from 'express';
import { Controller } from './Controller';
import { db } from '../../config/database';
import { devices, users, deviceUser, deviceSettings, sensorReadings } from '../models/schema';
import { eq, desc } from 'drizzle-orm';

export class DeviceController extends Controller {
  async index(req: Request, res: Response) {
    try {
      const allDevices = await db.select().from(devices);
      
      // Fetch related data
      for (let i = 0; i < allDevices.length; i++) {
          const device = allDevices[i] as any;
          
          // 1. Get Users
          const usersForDevice = await db.select({
              id: users.id, name: users.name, email: users.email, telegram_chat_id: users.telegramChatId
          })
          .from(deviceUser)
          .innerJoin(users, eq(deviceUser.user_id, users.id))
          .where(eq(deviceUser.device_id, device.id));
          
          device.users = usersForDevice;

          // 2. Get Settings
          const settings = await db.select().from(deviceSettings)
            .where(eq(deviceSettings.device_id, device.id)).limit(1);
          device.settings = settings.length > 0 ? settings[0] : null;

          // 3. Get latest sensor reading
          const latestReading = await db.select().from(sensorReadings)
            .where(eq(sensorReadings.device_id, device.id))
            .orderBy(desc(sensorReadings.recorded_at))
            .limit(1);
          device.sensor_readings = latestReading;
      }

      return this.sendResponse(res, allDevices, 'Devices retrieved successfully');
    } catch (error: any) {
      console.error(error);
      return this.sendError(res, 'Failed to fetch devices');
    }
  }

  async publicIndex(req: Request, res: Response) {
    try {
      const publicDevices = await db.select().from(devices).where(eq(devices.is_public, true));
      return this.sendResponse(res, publicDevices, 'Public devices retrieved successfully');
    } catch (error: any) {
      return this.sendError(res, 'Failed to fetch public devices');
    }
  }

  async store(req: Request, res: Response) {
    try {
      const { name, device_code, device_type, latitude, longitude, address, is_public } = req.body;
      const dataToInsert: any = {
        name,
        device_code,
        device_type: device_type || req.body.type,
        is_public: is_public === 'true' || is_public === true || false,
      };

      if (latitude) dataToInsert.latitude = parseFloat(latitude);
      if (longitude) dataToInsert.longitude = parseFloat(longitude);
      if (address) dataToInsert.address = address;

      // Handle image upload from multer
      const reqWithFile = req as any;
      if (reqWithFile.file) {
          dataToInsert.image = `/uploads/devices/${reqWithFile.file.filename}`;
      } else if (reqWithFile.files && reqWithFile.files.length > 0) {
          dataToInsert.image = `/uploads/devices/${reqWithFile.files[0].filename}`;
      }

      const [result] = await db.insert(devices).values(dataToInsert);
      
      const newDevice = await db.select().from(devices).where(eq(devices.id, Number(result.insertId))).limit(1);
      
      return this.sendResponse(res, newDevice[0], 'Device created successfully', 201);
    } catch (error: any) {
      console.error("Store error:", error);
      return this.sendError(res, 'Failed to create device: ' + error.message);
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deviceObj = await db.select().from(devices).where(eq(devices.id, Number(id))).limit(1);
      if (!deviceObj.length) return this.sendError(res, 'Device not found', 404);
      
      const device = deviceObj[0] as any;

      // 1. Get Users
      const usersForDevice = await db.select({
          id: users.id, name: users.name, email: users.email, telegram_chat_id: users.telegramChatId
      })
      .from(deviceUser)
      .innerJoin(users, eq(deviceUser.user_id, users.id))
      .where(eq(deviceUser.device_id, device.id));
          
      device.users = usersForDevice;

      // 2. Get Settings
      const settings = await db.select().from(deviceSettings)
        .where(eq(deviceSettings.device_id, device.id)).limit(1);
      device.settings = settings.length > 0 ? settings[0] : null;

      // 3. Get latest sensor reading
      const latestReading = await db.select().from(sensorReadings)
        .where(eq(sensorReadings.device_id, device.id))
        .orderBy(desc(sensorReadings.recorded_at))
        .limit(100);
      device.sensor_readings = latestReading;

      return this.sendResponse(res, device, 'Device retrieved successfully');
    } catch (error: any) {
      return this.sendError(res, 'Failed to fetch device');
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { _method, ...updateFields } = req.body;
      
      const allowedFields = ['name', 'device_code', 'device_type', 'latitude', 'longitude', 'address', 'is_public'];
      const dataToUpdate: any = {};
      
      Object.keys(updateFields).forEach(key => {
          if (allowedFields.includes(key) || key === 'type') {
              // map type to device_type if it came as type
              const finalKey = key === 'type' ? 'device_type' : key;
              
              const val = updateFields[key];
              // Handle boolean correctly
              if (finalKey === 'is_public') {
                   dataToUpdate[finalKey] = val === 'true' || val === true;
              } else if (finalKey === 'latitude' || finalKey === 'longitude') {
                   dataToUpdate[finalKey] = val ? parseFloat(val) : null;
              } else {
                   dataToUpdate[finalKey] = val;
              }
          }
      });

      // Handle image upload from multer
      const reqWithFile = req as any;
      if (reqWithFile.file) {
          dataToUpdate.image = `/uploads/devices/${reqWithFile.file.filename}`;
      } else if (reqWithFile.files && reqWithFile.files.length > 0) {
          dataToUpdate.image = `/uploads/devices/${reqWithFile.files[0].filename}`;
      }

      if (Object.keys(dataToUpdate).length === 0) {
          return this.sendResponse(res, null, 'No fields to update', 200);
      }

      await db.update(devices)
          .set(dataToUpdate)
          .where(eq(devices.id, Number(id)));
          
      const updatedDevice = await db.select().from(devices).where(eq(devices.id, Number(id))).limit(1);

      return this.sendResponse(res, updatedDevice[0], 'Device updated successfully');
    } catch (error: any) {
      console.error('Update Device Error:', error);
      return this.sendError(res, 'Failed to update device');
    }
  }
}

export default new DeviceController();
