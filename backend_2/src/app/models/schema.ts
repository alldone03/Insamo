import { mysqlTable, serial, varchar, text, timestamp, boolean, int, bigint, double, float, datetime, mysqlEnum } from 'drizzle-orm/mysql-core';

// 1. Roles
export const roles = mysqlTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
});

// 2. Users (Includes Better Auth fields + Custom Laravel fields)
export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password'),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  // Custom based on migrations
  roleId: bigint('role_id', { mode: 'number', unsigned: true }).references(() => roles.id),
  telegramChatId: varchar('telegram_chat_id', { length: 255 }),
});

// Better Auth required tables
export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).references(() => users.id),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// export const accounts = mysqlTable('accounts', {
//   id: varchar('id', { length: 255 }).primaryKey(),
//   userId: bigint('user_id', { mode: 'number', unsigned: true }).references(() => users.id),
//   accountId: varchar('account_id', { length: 255 }).notNull(),
//   providerId: varchar('provider_id', { length: 255 }).notNull(),
//   accessToken: text('access_token'),
//   refreshToken: text('refresh_token'),
//   expiresAt: timestamp('expires_at'),
//   password: text('password'),
//   createdAt: timestamp('created_at').defaultNow(),
//   updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
// });

// export const verifications = mysqlTable('verifications', {
//     id: varchar('id', { length: 255 }).primaryKey(),
//     identifier: text('identifier').notNull(),
//     value: text('value').notNull(),
//     expiresAt: timestamp('expires_at').notNull(),
//     createdAt: timestamp('created_at').defaultNow(),
//     updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
// });

// 3. Devices
export const devices = mysqlTable('devices', {
  id: serial('id').primaryKey(),
  device_code: varchar('device_code', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  device_type: varchar('device_type', { length: 255 }), // Changed to string in migration 2026_02_23_134337
  latitude: double('latitude'),
  longitude: double('longitude'),
  address: text('address'),
  image: varchar('image', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// 4. Device User
export const deviceUser = mysqlTable('device_user', {
    id: serial('id').primaryKey(),
    user_id: bigint('user_id', { mode: 'number', unsigned: true }).references(() => users.id, { onDelete: 'cascade' }),
    device_id: bigint('device_id', { mode: 'number', unsigned: true }).references(() => devices.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at').defaultNow(),
});

// 5. Device Settings
export const deviceSettings = mysqlTable('device_settings', {
    id: serial('id').primaryKey(),
    device_id: bigint('device_id', { mode: 'number', unsigned: true }).references(() => devices.id, { onDelete: 'cascade' }),
    initial_distance: float('initial_distance').notNull(),
    alert_threshold: float('alert_threshold').notNull(),
    danger_threshold: float('danger_threshold').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// 6. Sensor Readings
export const sensorReadings = mysqlTable('sensor_readings', {
    id: serial('id').primaryKey(),
    device_id: bigint('device_id', { mode: 'number', unsigned: true }).references(() => devices.id, { onDelete: 'cascade' }),
    recorded_at: datetime('recorded_at').notNull(),
    temperature: double('temperature'),
    humidity: double('humidity'),
    wind_speed: double('wind_speed'),
    water_level: double('water_level'),
    tilt_x: double('tilt_x'),
    tilt_y: double('tilt_y'),
    tilt_z: double('tilt_z'),
    magnitude: double('magnitude'),
    landslide_score: float('landslide_score'),
    landslide_status: varchar('landslide_status', { length: 255 }),
    // New fields from 2026_02_23_125924
    soil_moisture: double('soil_moisture'),
    vib_x: double('vib_x'),
    vib_y: double('vib_y'),
    vib_z: double('vib_z'),
    gyro_x: double('gyro_x'),
    gyro_y: double('gyro_y'),
    gyro_z: double('gyro_z'),
    rainfall_intensity: double('rainfall_intensity'),
    device_tilt: double('device_tilt'),
    created_at: timestamp('created_at').defaultNow(),
});

// 7. Classification Results
export const classificationResults = mysqlTable('classification_results', {
    id: serial('id').primaryKey(),
    sensor_reading_id: bigint('sensor_reading_id', { mode: 'number', unsigned: true }).references(() => sensorReadings.id, { onDelete: 'cascade' }),
    device_id: bigint('device_id', { mode: 'number', unsigned: true }).references(() => devices.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 255 }).notNull(),
    confidence: float('confidence').notNull(),
    created_at: timestamp('created_at').defaultNow(),
});

// 8. Weather Readings
export const weatherReadings = mysqlTable('weather_readings', {
    id: serial('id').primaryKey(),
    temperature: double('temperature').notNull(),
    humidity: double('humidity').notNull(),
    pressure: double('pressure').notNull(),
    wind_speed: double('wind_speed').notNull(),
    recorded_at: timestamp('recorded_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// 9. System Settings
export const systemSettings = mysqlTable('system_settings', {
    id: serial('id').primaryKey(),
    key: varchar('key', { length: 255 }).notNull().unique(),
    value: text('value'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// 10. Telegram Logs
export const telegramLogs = mysqlTable('telegram_logs', {
    id: serial('id').primaryKey(),
    chat_id: varchar('chat_id', { length: 255 }).notNull(),
    user_id: bigint('user_id', { mode: 'number', unsigned: true }).references(() => users.id, { onDelete: 'set null' }),
    message: text('message').notNull(),
    type: mysqlEnum('type', ['sent', 'received']).default('sent'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
