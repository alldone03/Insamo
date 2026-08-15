import { db } from '../../config/database';
import { sensorReadings, classificationResults } from '../models/schema';
import { eq, and, desc } from 'drizzle-orm';

const BASELINE_WINDOW = 30;
const MIN_BASELINE_SAMPLES = 5;
// Typical MPU6050 ambient noise floor (Gal) used until a device has enough
// of its own AMAN history to establish a real baseline.
const DEFAULT_BASELINE_MEAN = 0.5;
const DEFAULT_BASELINE_STD = 0.5;

/**
 * Scores how far the current PGA reading deviates from a device's own
 * recent "AMAN" baseline (mean/std), and stores it as a confidence-labeled
 * classification result. This is a statistical anomaly score, not a
 * trained ML model — there is no labeled real-earthquake dataset to train
 * on, so we lean on signal statistics rather than overclaiming "AI".
 */
export class SeismicClassificationService {
  static async classifyAndStore(
    deviceId: number,
    sensorReadingId: number,
    pgaGal: number | null,
    earthquakeStatus: string | null
  ) {
    if (pgaGal == null) return;

    try {
      const baseline = await db
        .select({ pga_gal: sensorReadings.pga_gal })
        .from(sensorReadings)
        .where(and(eq(sensorReadings.device_id, deviceId), eq(sensorReadings.earthquake_status, 'AMAN')))
        .orderBy(desc(sensorReadings.recorded_at))
        .limit(BASELINE_WINDOW);

      const baselineValues = baseline.map((b) => b.pga_gal).filter((v): v is number => v != null);

      let mean = DEFAULT_BASELINE_MEAN;
      let std = DEFAULT_BASELINE_STD;
      if (baselineValues.length >= MIN_BASELINE_SAMPLES) {
        mean = baselineValues.reduce((a, b) => a + b, 0) / baselineValues.length;
        const variance = baselineValues.reduce((a, b) => a + (b - mean) ** 2, 0) / baselineValues.length;
        std = Math.sqrt(variance) || DEFAULT_BASELINE_STD;
      }

      const zScore = (pgaGal - mean) / std;
      // Sigmoid centered at z=2 so a reading ~2 std devs above baseline sits at ~50% confidence.
      const confidence = 1 / (1 + Math.exp(-(zScore - 2)));

      await db.insert(classificationResults).values({
        device_id: deviceId,
        sensor_reading_id: sensorReadingId,
        label: earthquakeStatus || 'AMAN',
        confidence: Number(confidence.toFixed(4)),
      });
    } catch (err) {
      console.error('Seismic classification error:', err);
    }
  }
}
