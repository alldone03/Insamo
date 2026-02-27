import { Request, Response } from 'express';
import { Controller } from './Controller';
import { db } from '../../config/database';
import { users, devices } from '../models/schema';
import { eq } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Helper function to create storage configuration
const createStorage = (destinationFolder: string) => {
    const uploadPath = path.join(process.cwd(), 'uploads', destinationFolder);
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);
            cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        }
    });
};

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
};

// 5MB limit
const limits = { fileSize: 5 * 1024 * 1024 };

export const uploadUserImage = multer({
    storage: createStorage('users'),
    fileFilter,
    limits
}).single('photo');

export const uploadDeviceImage = multer({
    storage: createStorage('devices'),
    fileFilter,
    limits
}).any();
