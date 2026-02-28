import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../app/models/schema';
import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config();

async function run() {
    console.log('Seeding East Java Devices...');
    const poolConnection = mysql.createPool({
        host: process.env.DB_HOST === 'db' ? 'localhost' : (process.env.DB_HOST || 'localhost'),
        user: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'insamo_rw',
        port: Number(process.env.DB_PORT_EXTERNAL) || 3306,
    });
    
    const db = drizzle(poolConnection, { schema, mode: 'default' });

    const eastJavaCities = [
        { name: 'Surabaya', lat: -7.2575, lng: 112.7521, type: 'FLOWS' },
        { name: 'Malang', lat: -7.9839, lng: 112.6214, type: 'SIGMA' },
        { name: 'Kediri', lat: -7.8480, lng: 112.0178, type: 'LANDSLIDE' },
        { name: 'Madiun', lat: -7.6298, lng: 111.5239, type: 'FLOWS' },
        { name: 'Jember', lat: -8.1724, lng: 113.7005, type: 'SIGMA' },
        { name: 'Banyuwangi', lat: -8.2192, lng: 114.3691, type: 'WILDFIRE' },
        { name: 'Blitar', lat: -8.0983, lng: 112.1681, type: 'LANDSLIDE' },
        { name: 'Mojokerto', lat: -7.4726, lng: 112.4381, type: 'FLOWS' },
        { name: 'Pasuruan', lat: -7.6444, lng: 112.9031, type: 'SIGMA' },
        { name: 'Probolinggo', lat: -7.7545, lng: 113.2045, type: 'WILDFIRE' },
        { name: 'Batu', lat: -7.8700, lng: 112.5265, type: 'LANDSLIDE' },
        { name: 'Sidoarjo', lat: -7.4478, lng: 112.7183, type: 'FLOWS' },
        { name: 'Gresik', lat: -7.1592, lng: 112.6515, type: 'FLOWS' },
        { name: 'Lamongan', lat: -7.1190, lng: 112.4150, type: 'FLOWS' },
        { name: 'Tuban', lat: -6.8944, lng: 112.0573, type: 'SIGMA' },
        { name: 'Bojonegoro', lat: -7.1502, lng: 111.8818, type: 'FLOWS' },
        { name: 'Ngawi', lat: -7.4024, lng: 111.4449, type: 'LANDSLIDE' },
        { name: 'Magetan', lat: -7.6543, lng: 111.3283, type: 'LANDSLIDE' },
        { name: 'Ponorogo', lat: -7.8711, lng: 111.4621, type: 'LANDSLIDE' },
        { name: 'Tulungagung', lat: -8.0666, lng: 111.9022, type: 'FLOWS' },
    ];

    try {
        const devicesToInsert = eastJavaCities.map((city, index) => ({
            device_code: `EJ-DEV-${(index + 1).toString().padStart(3, '0')}`,
            name: `${city.name} Monitor`,
            device_type: city.type,
            latitude: city.lat,
            longitude: city.lng,
            address: `${city.name}, Jawa Timur, Indonesia`
        }));

        console.log(`Inserting ${devicesToInsert.length} devices...`);
        
        for (const dev of devicesToInsert) {
            await db.insert(schema.devices).values(dev).onDuplicateKeyUpdate({
                set: { 
                    name: dev.name,
                    latitude: dev.latitude,
                    longitude: dev.longitude,
                    address: dev.address,
                    device_type: dev.device_type
                }
            });
        }

        // Add device settings
        const allDevices = await db.select().from(schema.devices);
        const ejDevices = allDevices.filter(d => d.device_code.startsWith('EJ-DEV-'));
        
        console.log('Adding Device Settings...');
        for (const device of ejDevices) {
            await db.insert(schema.deviceSettings).values({
                device_id: device.id,
                initial_distance: 10.0,
                alert_threshold: 50.0,
                danger_threshold: 80.0,
            }).onDuplicateKeyUpdate({ set: { initial_distance: 10.0 } });
        }

        console.log('East Java Devices seeded successfully.');
    } catch (e) {
        console.error('Seeding failed:', e);
    } finally {
        await poolConnection.end();
    }
}

run();
