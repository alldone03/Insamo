import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import http from 'http';
import { Server } from 'socket.io';
import { db } from './config/database';
import { sql } from 'drizzle-orm';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
});

export { io };

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api', apiRoutes);

app.get('/', async (req: Request, res: Response) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({
      message: 'Insamo Backend v2 (Express + Drizzle + Better Auth) is running!',
      // database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Insamo Backend v2 (Express + Drizzle + Better Auth) is Not!',
      // database: 'disconnected',
      // error: error instanceof Error ? error.message : String(error)
    });
  }
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
