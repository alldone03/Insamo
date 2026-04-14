import { Router, Request, Response } from 'express';
import { db } from '../config/database';
import { sensorReadings, devices, deviceSettings } from '../app/models/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

const PREDICTION_SERVICE_URL = process.env.PREDICTION_SERVICE_URL || 'http://prediction:8501';

/**
 * GET /api/predict/:deviceId
 * 
 * Mengambil 150 data water_level terakhir dari device,
 * kirim ke LSTM microservice, return hasilnya.
 * 
 * Query params:
 *   - predict_steps (default 50)
 *   - epochs (default 50)
 */
router.get('/predict/:deviceId', async (req: Request, res: Response) => {
    try {
        const deviceId = Number(req.params.deviceId);

        // Fetch device
        const deviceRecords = await db.select().from(devices).where(eq(devices.id, deviceId)).limit(1);
        if (!deviceRecords.length) {
            return res.status(404).json({ success: false, message: 'Device not found' });
        }
        const device = deviceRecords[0];

        // Fetch device settings for thresholds
        const settingRecords = await db.select().from(deviceSettings).where(eq(deviceSettings.device_id, deviceId)).limit(1);
        const alert_threshold = settingRecords.length > 0 ? settingRecords[0].alert_threshold : 50.0;
        const danger_threshold = settingRecords.length > 0 ? settingRecords[0].danger_threshold : 80.0;

        // Fetch 150 latest sensor readings with water_level
        const readings = await db.select({
            water_level: sensorReadings.water_level,
            recorded_at: sensorReadings.recorded_at,
        })
            .from(sensorReadings)
            .where(eq(sensorReadings.device_id, deviceId))
            .orderBy(desc(sensorReadings.recorded_at))
            .limit(150);

        if (readings.length < 100) {
            return res.status(400).json({
                success: false,
                message: `Need at least 100 readings, found ${readings.length}`,
            });
        }

        // Reverse to chronological order & extract water_level
        const chronological = readings.reverse();
        const waterLevels = chronological.map((r: any) => r.water_level ?? 0);
        const timestamps = chronological.map((r: any) => r.recorded_at);

        const predict_steps = Number(req.query.predict_steps) || 50;
        const epochs = Number(req.query.epochs) || 50;

        // Call LSTM microservice
        const response = await fetch(`${PREDICTION_SERVICE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                water_level: waterLevels,
                predict_steps,
                alert_threshold,
                danger_threshold,
                epochs,
                lookback: 10,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            return res.status(response.status).json({ success: false, message: `Prediction service error: ${error}` });
        }

        const predictionResult = await response.json();

        // Attach metadata
        return res.json({
            success: true,
            data: {
                device: {
                    id: device.id,
                    name: device.name,
                    device_code: device.device_code,
                    device_type: device.device_type,
                },
                thresholds: {
                    alert: alert_threshold,
                    danger: danger_threshold,
                },
                timestamps: timestamps.map((t: any) => t instanceof Date ? t.toISOString() : t),
                ...predictionResult,
            },
        });
    } catch (error: any) {
        console.error('[PREDICT] Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/predict-devices
 * 
 * List semua FLOWS devices yang bisa di-predict.
 */
router.get('/predict-devices', async (req: Request, res: Response) => {
    try {
        const flowsDevices = await db.select({
            id: devices.id,
            name: devices.name,
            device_code: devices.device_code,
        })
            .from(devices)
            .where(eq(devices.device_type, 'FLOWS'));

        return res.json({ success: true, data: flowsDevices });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

export default router;