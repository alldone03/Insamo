/**
 * PPE Violations Schema (Drizzle ORM)
 * ====================================
 * TAMBAHKAN tabel ini ke file schema yang sudah ada di INSAMO.
 * 
 * Buka file: backend/src/app/models/schema.ts
 * Lalu APPEND export ini di bagian bawah file.
 * 
 * Setelah itu jalankan:
 *   yarn db:generate   (buat migration file)
 *   yarn db:migrate    (apply ke database)
 *   atau: yarn db:push (development, langsung sync)
 */

import { mysqlTable, bigint, varchar, timestamp, int } from 'drizzle-orm/mysql-core';

export const ppeViolations = mysqlTable('ppe_violations', {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    tanggal: varchar('tanggal', { length: 20 }).notNull(),
    waktu: varchar('waktu', { length: 20 }).notNull(),
    lokasi: varchar('lokasi', { length: 50 }).notNull(),
    jenis_pelanggaran: varchar('jenis_pelanggaran', { length: 100 }).notNull(),
    bukti_filename: varchar('bukti_filename', { length: 255 }).default(''),
    bukti_path: varchar('bukti_path', { length: 500 }).default(''),
    created_at: timestamp('created_at').defaultNow(),
});
