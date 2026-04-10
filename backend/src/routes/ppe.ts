/**
 * PPE Detection Routes
 * ====================
 * Tambahkan file ini di: backend/src/routes/ppe.ts
 * 
 * Lalu register di api.ts (lihat instruksi di bawah).
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import PpeController from '../app/controllers/PpeController';

const ppeRouter = Router();

// ============================================================
// Multer config — upload foto bukti dari PPE Service
// ============================================================
const uploadDir = path.resolve(__dirname, '../../uploads/ppe');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const name = req.body.filename || file.originalname;
        cb(null, name);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only .jpg, .jpeg, .png allowed'));
        }
    },
});

// ============================================================
// Middleware: API Key auth untuk PPE Service
// ============================================================
const PPE_API_KEY = process.env.PPE_SERVICE_API_KEY || '';

function ppeServiceAuth(req: Request, res: Response, next: any) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Jika cocok dengan PPE_SERVICE_API_KEY → izinkan (dari PPE service)
    if (PPE_API_KEY && token === PPE_API_KEY) {
        return next();
    }

    // Jika tidak, coba verify sebagai JWT (dari user web)
    try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET);
        (req as any).user = decoded;
        return next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
}

// ============================================================
// Routes
// ============================================================

// POST — Terima pelanggaran dari PPE Service (API key auth)
ppeRouter.post('/violations', ppeServiceAuth, upload.single('bukti'),
    (req, res) => PpeController.store(req, res));

// GET — Query data (JWT auth)
ppeRouter.get('/violations', ppeServiceAuth,
    (req, res) => PpeController.index(req, res));

// GET — Statistik
ppeRouter.get('/stats', ppeServiceAuth,
    (req, res) => PpeController.stats(req, res));

// GET — Foto bukti (public, no auth — agar bisa di-load oleh <img>)
ppeRouter.get('/violations/:id/image',
    (req, res) => PpeController.image(req, res));

export default ppeRouter;
