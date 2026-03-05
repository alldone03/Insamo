import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../app/models/schema';
import dotenv from 'dotenv';
import { hashSync } from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { auth } from '../config/auth';

dotenv.config();

// Utility for seeding similar to Laravel
async function run() {
    console.log('Seeding database...');
    const poolConnection = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT) || 3306,
    });
    
    const db = drizzle(poolConnection, { schema, mode: 'default' });

    try {
        // 1. Seed Roles
        console.log('Seeding Roles...');
        await db.insert(schema.roles).values([
            { name: 'SuperAdmin' },
            { name: 'Admin' },
            { name: 'User' },
        ]).onDuplicateKeyUpdate({ set: { id: sql`id` } }); // simplified ignore

        const allRoles = await db.select().from(schema.roles);
        const superAdminRole = allRoles.find(r => r.name === 'SuperAdmin');
        const adminRole = allRoles.find(r => r.name === 'Admin');
        const userRole = allRoles.find(r => r.name === 'User');

        // 2. Seed Users via Better Auth so passwords match hash requirements
        // Need to check if auth.api works without request context in node for creation? 
        // We can just insert directly into users table mimicking what Better Auth does but we need a hashed password.
        // Or we use auth plugin/API here.
        // For simplicity of a seed script, we will insert directly and leave password as unhashed or simple string 
        // Note: Better Auth encrypts passwords. For seeding test users, we will use plain insert but they might not login if BetterAuth checks hashes.
        // For simplicity of a seed script, we will use plain text passwords as requested.
        const hashedPassword = hashSync('password', 10);
        
        await db.insert(schema.users).values([
            { id: 1, name: 'Super Admin', email: 'superadmin@example.com', password: hashedPassword, roleId: superAdminRole?.id, emailVerified: true },
            { id: 2, name: 'Admin User', email: 'admin@example.com', password: hashedPassword, roleId: adminRole?.id, emailVerified: true },
            { id: 3, name: 'Regular User', email: 'user@example.com', password: hashedPassword, roleId: userRole?.id, emailVerified: true },
        ]).onDuplicateKeyUpdate({ set: { password: sql`VALUES(password)` } });

        // Seed Better Auth accounts so credential login works
        // await db.insert(schema.accounts).values([
        //     { id: 'acc-1', userId: 1, accountId: 'superadmin@example.com', providerId: 'email', password: hashedPassword },
        //     { id: 'acc-2', userId: 2, accountId: 'admin@example.com', providerId: 'email', password: hashedPassword },
        //     { id: 'acc-3', userId: 3, accountId: 'user@example.com', providerId: 'email', password: hashedPassword },
        // ]).onDuplicateKeyUpdate({ set: { password: mysql.raw('VALUES(password)') },  });


        // 3. Seed System Settings
        console.log('Seeding System Settings...');
        await db.insert(schema.systemSettings).values([
            { key: 'telegram_bot_token', value: 'YOUR_BOT_TOKEN' },
            { key: 'flood_alert_template', value: "🚨 *FLOOD ALERT* 🚨\nDevice: {device_name}\nStatus: {status}\nWater Level: {water_level}m\nThreshold: {threshold}m\nLocation: {location}" },
        ]).onDuplicateKeyUpdate({ set: { value: sql`VALUES(value)` } });

        // 4. Seed Devices
        console.log('Seeding Devices...');
        await db.insert(schema.devices).values([
            { device_code: 'SIGMA-001', name: 'Seismic Node A1', device_type: 'SIGMA', latitude: -6.200000, longitude: 106.816666, address: 'Jakarta, Indonesia' },
            { device_code: 'FLOWS-001', name: 'Ciliwung River Sensor', device_type: 'FLOWS', latitude: -6.220100, longitude: 106.827000, address: 'Jakarta South' },
            { device_code: 'FLOWS-002', name: 'Bandung Basin Monitor', device_type: 'FLOWS', latitude: -6.917464, longitude: 107.619125, address: 'Bandung, Indonesia' },
            { device_code: 'LANDSLIDE-001', name: 'Puncak Pass Monitor', device_type: 'LANDSLIDE', latitude: -6.702400, longitude: 106.993000, address: 'Bogor Regancy' },
            { device_code: 'WILDFIRE-001', name: 'Kalimantan Forest Node', device_type: 'WILDFIRE', latitude: -1.269160, longitude: 116.825264, address: 'Balikpapan Surrounding' },
        ]).onDuplicateKeyUpdate({ set: { name: sql`VALUES(name)` } });

        // 5. Seed Device Settings
        console.log('Seeding Device Settings...');
        const devices = await db.select().from(schema.devices);
        for (const device of devices) {
            await db.insert(schema.deviceSettings).values({
                device_id: device.id,
                initial_distance: 10.0,
                alert_threshold: 50.0,
                danger_threshold: 80.0,
            }).onDuplicateKeyUpdate({ set: { initial_distance: 10.0 } });
        }

        // 6. Seed Sensor Readings
        console.log('Seeding Sensor Readings...');
        for (const device of devices) {
            for (let i = 0; i < 10; i++) {
                const recordedAt = new Date();
                recordedAt.setHours(recordedAt.getHours() - i);
                
                await db.insert(schema.sensorReadings).values({
                    device_id: device.id,
                    recorded_at: recordedAt,
                    temperature: Math.floor(Math.random() * (35 - 25 + 1)) + 25 + Math.random(),
                    humidity: Math.floor(Math.random() * (90 - 60 + 1)) + 60 + Math.random(),
                    wind_speed: Math.floor(Math.random() * 20) + Math.random(),
                    water_level: Math.floor(Math.random() * 500) / 10,
                    tilt_x: Math.floor(Math.random() * 20 - 10) / 10,
                    tilt_y: Math.floor(Math.random() * 20 - 10) / 10,
                    magnitude: Math.floor(Math.random() * 50) / 10,
                    landslide_score: Math.floor(Math.random() * 100) / 100,
                    landslide_status: Math.random() > 0.5 ? 'SAFE' : 'WARNING',
                });
            }
        }

        console.log('Database seeding completed successfully.');
    } catch (e) {
        console.error('Seeding failed:', e);
    } finally {
        await poolConnection.end();
    }
}

run();
