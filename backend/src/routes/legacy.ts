/**
 * =============================================================================
 * Legacy ESP32 Compatibility Route
 * =============================================================================
 * 
 * This route accepts GET requests in the old PHP format:
 *   /api/legacy/flowsjson?deviceid=10&suhu=30.5&statushujan=tidak-hujan&distance=210.2&latitude=-7.28&longitude=112.75
 * 
 * And converts them to the new sensor_readings format, calling the same
 * store logic as SensorReadingController.
 * 
 * This allows the existing ESP32 firmware to keep working during the
 * transition period without requiring a firmware flash.
 * 
 * Remove this file once all ESP32 devices have been updated to the new firmware.
 */

import { Router, Request, Response } from 'express';
import { db } from '../config/database';
import { devices, deviceSettings, sensorReadings, weatherReadings } from '../app/models/schema';
import { eq, desc } from 'drizzle-orm';
import { TelegramService } from '../app/services/TelegramService';
import { io } from '../index';

const legacyRouter = Router();

/**
 * GET /api/legacy/flowsjson
 * 
 * Accepts the old ESP32 query format and inserts into the new schema.
 * Mirrors the logic from the old flowsjson.php endpoint.
 */
legacyRouter.get('/flowsjson', async (req: Request, res: Response) => {
    try {
        const {
            deviceid,
            suhu,
            statushujan,
            distance,
            latitude,
            longitude,
        } = req.query;

        if (!deviceid) {
            return res.status(400).json({ success: false, message: 'deviceid is required' });
        }

        // --- 1. Resolve device by legacy ID ---
        // Legacy device IDs map to device_codes like "FLOWS-010"
        const legacyId = String(deviceid);
        const deviceCode = `FLOWS-${legacyId.padStart(3, '0')}`;

        const deviceRecords = await db.select().from(devices)
            .where(eq(devices.device_code, deviceCode))
            .limit(1);

        if (!deviceRecords.length) {
            // Fallback: try exact match on device_code = raw deviceid
            const fallback = await db.select().from(devices)
                .where(eq(devices.device_code, legacyId))
                .limit(1);
            
            if (!fallback.length) {
                return res.status(404).json({ 
                    success: false, 
                    message: `Device not found for legacy ID '${legacyId}' (tried code '${deviceCode}')` 
                });
            }
            deviceRecords.push(fallback[0]);
        }

        const device = deviceRecords[0];

        // --- 2. Get device settings for water level calculation ---
        const settingRecords = await db.select().from(deviceSettings)
            .where(eq(deviceSettings.device_id, device.id))
            .limit(1);

        const settings = settingRecords[0] || { initial_distance: 272, alert_threshold: 50, danger_threshold: 80 };

        // --- 3. Calculate water level ---
        // Legacy PHP had a trigger: Data_ketinggian_air = 272 - distance (for device 10)
        // Now we do this in application layer using initial_distance from settings
        const distanceValue = distance ? parseFloat(String(distance)) : 0;
        const waterLevel = Math.max(0, settings.initial_distance - distanceValue);

        // --- 4. Get latest wind_speed from weather_readings ---
        // Legacy PHP did: SELECT wind_speed FROM cuaca ORDER BY datetime DESC LIMIT 1
        let windSpeed: number | null = null;
        try {
            const weatherRows = await db.select({ wind_speed: weatherReadings.wind_speed })
                .from(weatherReadings)
                .orderBy(desc(weatherReadings.recorded_at))
                .limit(1);
            if (weatherRows.length) {
                windSpeed = weatherRows[0].wind_speed;
            }
        } catch (e) {
            // Weather table might be empty, that's fine
        }

        // --- 5. Determine rainfall intensity from status ---
        // Legacy sent "hujan" or "tidak-hujan" as statushujan
        const statusHujanStr = String(statushujan || 'tidak-hujan').toLowerCase();
        const rainfallIntensity = statusHujanStr.includes('hujan') && !statusHujanStr.includes('tidak') ? 1.0 : 0.0;

        // --- 6. Insert sensor reading ---
        const [insertResult] = await db.insert(sensorReadings).values({
            device_id: device.id,
            recorded_at: new Date(),
            temperature: suhu ? parseFloat(String(suhu)) : null,
            humidity: null,
            wind_speed: windSpeed,
            water_level: waterLevel,
            tilt_x: null,
            tilt_y: null,
            tilt_z: null,
            magnitude: null,
            landslide_score: null,
            landslide_status: null,
            soil_moisture: null,
            vib_x: null,
            vib_y: null,
            vib_z: null,
            gyro_x: null,
            gyro_y: null,
            gyro_z: null,
            rainfall_intensity: rainfallIntensity,
            device_tilt: null,
        });

        const readingResult = await db.select().from(sensorReadings)
            .where(eq(sensorReadings.id, Number(insertResult.insertId)))
            .limit(1);
        const reading = readingResult[0];

        // --- 7. Update device coordinates if provided ---
        const lat = latitude ? parseFloat(String(latitude)) : null;
        const lng = longitude ? parseFloat(String(longitude)) : null;
        if (lat && lng && (lat !== 0 || lng !== 0)) {
            await db.update(devices)
                .set({ latitude: lat, longitude: lng })
                .where(eq(devices.id, device.id));
        }

        // --- 8. Alert Logic (same as SensorReadingController) ---
        if (waterLevel >= settings.danger_threshold) {
            await TelegramService.sendFloodAlert(
                { id: device.id, name: device.name, address: device.address || '' },
                'DANGER', waterLevel, settings.danger_threshold
            );
        } else if (waterLevel >= settings.alert_threshold) {
            await TelegramService.sendFloodAlert(
                { id: device.id, name: device.name, address: device.address || '' },
                'ALERT', waterLevel, settings.alert_threshold
            );
        }

        // --- 9. Socket.IO realtime broadcast ---
        io.emit('new_sensor_reading', {
            device_id: device.id,
            reading: reading,
            device_type: device.device_type,
        });

        // --- 10. Return success (legacy ESP32 doesn't really check this) ---
        return res.json({
            success: true,
            message: 'Data received via legacy endpoint',
            device_code: device.device_code,
            water_level: waterLevel,
            reading_id: reading?.id,
        });

    } catch (error: any) {
        console.error('[Legacy Route Error]', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/legacy/sigmajson
 * 
 * Legacy endpoint for SIGMA (earthquake/tilt) sensors.
 * Accepts: deviceid, ax, ay, az, latitude, longitude
 */
legacyRouter.get('/sigmajson', async (req: Request, res: Response) => {
    try {
        const { deviceid, ax, ay, az, latitude, longitude } = req.query;

        if (!deviceid) {
            return res.status(400).json({ success: false, message: 'deviceid is required' });
        }

        const legacyId = String(deviceid);
        const deviceCode = `SIGMA-${legacyId.padStart(3, '0')}`;

        const deviceRecords = await db.select().from(devices)
            .where(eq(devices.device_code, deviceCode))
            .limit(1);

        if (!deviceRecords.length) {
            return res.status(404).json({ success: false, message: `Device '${deviceCode}' not found` });
        }

        const device = deviceRecords[0];

        // Calculate magnitude same as legacy trigger
        const tiltX = ax ? parseFloat(String(ax)) : 0;
        const tiltY = ay ? parseFloat(String(ay)) : 0;
        const tiltZ = az ? parseFloat(String(az)) : 0;
        const magnitude = Math.sqrt(
            Math.pow(tiltX / 16384, 2) +
            Math.pow(tiltY / 16384, 2) +
            Math.pow(tiltZ / 16384, 2)
        );

        const [insertResult] = await db.insert(sensorReadings).values({
            device_id: device.id,
            recorded_at: new Date(),
            tilt_x: tiltX,
            tilt_y: tiltY,
            tilt_z: tiltZ,
            magnitude: magnitude,
            temperature: null, humidity: null, wind_speed: null, water_level: null,
            landslide_score: null, landslide_status: null, soil_moisture: null,
            vib_x: null, vib_y: null, vib_z: null,
            gyro_x: null, gyro_y: null, gyro_z: null,
            rainfall_intensity: null, device_tilt: null,
        });

        const readingResult = await db.select().from(sensorReadings)
            .where(eq(sensorReadings.id, Number(insertResult.insertId)))
            .limit(1);

        io.emit('new_sensor_reading', {
            device_id: device.id,
            reading: readingResult[0],
            device_type: device.device_type,
        });

        return res.json({ success: true, message: 'SIGMA data received', magnitude });

    } catch (error: any) {
        console.error('[Legacy SIGMA Route Error]', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

export default legacyRouter;
