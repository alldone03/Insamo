/**
 * PPE Violation Controller
 * ========================
 * Tambahkan file ini di: backend/src/app/controllers/PpeController.ts
 */

import { Request, Response } from 'express';
import { db } from '../../config/database';
import { ppeViolations } from '../models/schema'; // Pastikan sudah di-append ke schema.ts
import { eq, and, gte, lte, sql, desc, count } from 'drizzle-orm';
import { io } from '../../index';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.resolve(__dirname, '../../../uploads/ppe');

// Pastikan folder ada
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

class PpeController {

    /**
     * POST /api/ppe/violations
     * Terima data pelanggaran dari PPE Detection Service
     */
    async store(req: Request, res: Response) {
        try {
            const { tanggal, waktu, lokasi, jenis_pelanggaran, filename } = req.body;

            if (!tanggal || !waktu || !lokasi) {
                return res.status(400).json({
                    success: false,
                    message: 'tanggal, waktu, lokasi wajib diisi'
                });
            }

            // Handle file upload (via multer)
            let buktiFilename = filename || '';
            let buktiPath = '';

            if ((req as any).file) {
                buktiFilename = (req as any).file.filename;
                buktiPath = (req as any).file.path;
            } else if (filename) {
                buktiPath = path.join(UPLOAD_DIR, filename);
            }

            const [insertResult] = await db.insert(ppeViolations).values({
                tanggal,
                waktu,
                lokasi,
                jenis_pelanggaran: jenis_pelanggaran || 'Unknown',
                bukti_filename: buktiFilename,
                bukti_path: buktiPath,
            });

            // Fetch the inserted record
            const record = await db.select().from(ppeViolations)
                .where(eq(ppeViolations.id, Number(insertResult.insertId)))
                .limit(1);

            // Broadcast via Socket.IO untuk realtime update di frontend
            io.emit('ppe_violation', {
                violation: record[0],
                lokasi,
                jenis_pelanggaran: jenis_pelanggaran || 'Unknown',
            });

            console.log(`[PPE] Violation: ${jenis_pelanggaran} @ ${lokasi}`);

            return res.status(201).json({
                success: true,
                message: 'Violation recorded',
                data: record[0],
            });

        } catch (error: any) {
            console.error('[PPE] Store error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/ppe/violations
     * Query data pelanggaran dengan filter
     * Query: ?start=2025-01-01&end=2025-12-31&lokasi=Camera 1&page=1&per_page=50
     */
    async index(req: Request, res: Response) {
        try {
            const {
                start,
                end,
                lokasi,
                page = '1',
                per_page = '50'
            } = req.query;

            const pageNum = parseInt(String(page));
            const limit = parseInt(String(per_page));
            const offset = (pageNum - 1) * limit;

            // Build where conditions
            const conditions: any[] = [];

            if (start) {
                conditions.push(gte(ppeViolations.tanggal, String(start)));
            }
            if (end) {
                conditions.push(lte(ppeViolations.tanggal, String(end)));
            }
            if (lokasi) {
                conditions.push(eq(ppeViolations.lokasi, String(lokasi)));
            }

            const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            // Query data
            const data = await db.select().from(ppeViolations)
                .where(whereClause)
                .orderBy(desc(ppeViolations.created_at))
                .limit(limit)
                .offset(offset);

            // Count total
            const totalResult = await db.select({ count: count() })
                .from(ppeViolations)
                .where(whereClause);

            const total = totalResult[0]?.count || 0;

            return res.json({
                success: true,
                data,
                pagination: {
                    page: pageNum,
                    per_page: limit,
                    total,
                    total_pages: Math.ceil(total / limit),
                },
            });

        } catch (error: any) {
            console.error('[PPE] Index error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/ppe/stats
     * Statistik: total, per kamera, per jenis, per tanggal
     */
    async stats(req: Request, res: Response) {
        try {
            const { start, end } = req.query;
            const conditions: any[] = [];

            if (start) conditions.push(gte(ppeViolations.tanggal, String(start)));
            if (end) conditions.push(lte(ppeViolations.tanggal, String(end)));

            const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            // Total
            const totalResult = await db.select({ count: count() })
                .from(ppeViolations)
                .where(whereClause);

            // Per kamera
            const perCamera = await db.select({
                lokasi: ppeViolations.lokasi,
                count: count(),
            })
                .from(ppeViolations)
                .where(whereClause)
                .groupBy(ppeViolations.lokasi)
                .orderBy(ppeViolations.lokasi);

            // Per jenis pelanggaran
            const perType = await db.select({
                jenis: ppeViolations.jenis_pelanggaran,
                count: count(),
            })
                .from(ppeViolations)
                .where(whereClause)
                .groupBy(ppeViolations.jenis_pelanggaran);

            // Per tanggal (30 hari terakhir)
            const perDate = await db.select({
                tanggal: ppeViolations.tanggal,
                count: count(),
            })
                .from(ppeViolations)
                .where(whereClause)
                .groupBy(ppeViolations.tanggal)
                .orderBy(desc(ppeViolations.tanggal))
                .limit(30);

            return res.json({
                success: true,
                total: totalResult[0]?.count || 0,
                perCamera: perCamera.map(r => ({ lokasi: r.lokasi, count: r.count })),
                perType: perType.map(r => ({ jenis: r.jenis, count: r.count })),
                perDate: perDate.map(r => ({ tanggal: r.tanggal, count: r.count })).reverse(),
            });

        } catch (error: any) {
            console.error('[PPE] Stats error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/ppe/violations/:id/image
     * Serve foto bukti
     */
    async image(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const records = await db.select().from(ppeViolations)
                .where(eq(ppeViolations.id, parseInt(id)))
                .limit(1);

            if (!records.length) {
                return res.status(404).json({ success: false, message: 'Not found' });
            }

            const record = records[0];

            // Coba dari bukti_path, lalu dari UPLOAD_DIR + filename
            let imagePath = record.bukti_path || '';
            if (!fs.existsSync(imagePath)) {
                imagePath = path.join(UPLOAD_DIR, record.bukti_filename || '');
            }

            if (!fs.existsSync(imagePath)) {
                return res.status(404).json({ success: false, message: 'Image not found' });
            }

            return res.sendFile(path.resolve(imagePath));

        } catch (error: any) {
            console.error('[PPE] Image error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new PpeController();
