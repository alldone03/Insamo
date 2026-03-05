import { Request, Response } from 'express';
import { Controller } from './Controller';
import { db } from '../../config/database';
import { devices, users, deviceUser, deviceSettings, sensorReadings } from '../models/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

export class DeviceController extends Controller {
  async index(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      let allDevices: any[];

      if (user.roleId === 1) {
        allDevices = await db.select().from(devices);
      } else {
        allDevices = await db.select({
          id: devices.id,
          device_code: devices.device_code,
          name: devices.name,
          device_type: devices.device_type,
          latitude: devices.latitude,
          longitude: devices.longitude,
          address: devices.address,
          image: devices.image,
          createdAt: devices.createdAt,
          updatedAt: devices.updatedAt,
        })
        .from(devices)
        .innerJoin(deviceUser, eq(devices.id, deviceUser.device_id))
        .where(eq(deviceUser.user_id, user.id));
      }
      
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
      const publicDevices = await db.select().from(devices);
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
      const insertedId = Number(result.insertId);

      // Handle settings
      const { initial_distance, alert_threshold, danger_threshold } = req.body;
      if (initial_distance !== undefined || alert_threshold !== undefined || danger_threshold !== undefined) {
          await db.insert(deviceSettings).values({
              device_id: insertedId,
              initial_distance: initial_distance ? parseFloat(initial_distance) : 10,
              alert_threshold: alert_threshold ? parseFloat(alert_threshold) : 50,
              danger_threshold: danger_threshold ? parseFloat(danger_threshold) : 80,
          });
      }
      
      const newDevice = await db.select().from(devices).where(eq(devices.id, insertedId)).limit(1);
      
      return this.sendResponse(res, newDevice[0], 'Device created successfully', 201);
    } catch (error: any) {
      console.error("Store error:", error);
      return this.sendError(res, 'Failed to create device: ' + error.message);
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      let deviceQuery;
      if (user.roleId === 1) {
        deviceQuery = db.select().from(devices).where(eq(devices.id, Number(id))).limit(1);
      } else {
        // For non-superadmins, check if they have access to this specific device
        deviceQuery = db.select({
          id: devices.id,
          device_code: devices.device_code,
          name: devices.name,
          device_type: devices.device_type,
          latitude: devices.latitude,
          longitude: devices.longitude,
          address: devices.address,
          image: devices.image,
          createdAt: devices.createdAt,
          updatedAt: devices.updatedAt,
        })
        .from(devices)
        .innerJoin(deviceUser, eq(devices.id, deviceUser.device_id))
        .where(
          and(
            eq(devices.id, Number(id)),
            eq(deviceUser.user_id, user.id)
          )
        )
        .limit(1);
      }

      const deviceObj = await deviceQuery;
      if (!deviceObj.length) return this.sendError(res, 'Device not found or access denied', 404);
      
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
      
      // 4. Get total readings count
      const [countResult] = await db.select({ 
        total: sql<number>`count(*)` 
      })
      .from(sensorReadings)
      .where(eq(sensorReadings.device_id, device.id));
      
      device.total_readings = Number(countResult?.total || 0);

      return this.sendResponse(res, device, 'Device retrieved successfully');
    } catch (error: any) {
      console.error('Show error:', error);
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

      // Handle settings update
      const { initial_distance, alert_threshold, danger_threshold } = req.body;
      if (initial_distance !== undefined || alert_threshold !== undefined || danger_threshold !== undefined) {
          const existingSettings = await db.select().from(deviceSettings)
              .where(eq(deviceSettings.device_id, Number(id))).limit(1);

          const settingsData: any = {};
          if (initial_distance !== undefined) settingsData.initial_distance = parseFloat(initial_distance);
          if (alert_threshold !== undefined) settingsData.alert_threshold = parseFloat(alert_threshold);
          if (danger_threshold !== undefined) settingsData.danger_threshold = parseFloat(danger_threshold);

          if (existingSettings.length > 0) {
              await db.update(deviceSettings)
                  .set(settingsData)
                  .where(eq(deviceSettings.device_id, Number(id)));
          } else {
              await db.insert(deviceSettings).values({
                  device_id: Number(id),
                  initial_distance: parseFloat(initial_distance) || 10,
                  alert_threshold: parseFloat(alert_threshold) || 50,
                  danger_threshold: parseFloat(danger_threshold) || 80,
              });
          }
      }
          
      const updatedDevice = await db.select().from(devices).where(eq(devices.id, Number(id))).limit(1);

      return this.sendResponse(res, updatedDevice[0], 'Device updated successfully');
    } catch (error: any) {
      console.error('Update Device Error:', error);
      return this.sendError(res, 'Failed to update device');
    }
  }
}

export default new DeviceController();
