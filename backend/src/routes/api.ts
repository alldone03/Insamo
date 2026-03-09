import { Router } from 'express';
import AuthController from '../app/controllers/AuthController';
import DeviceController from '../app/controllers/DeviceController';
import SensorReadingController from '../app/controllers/SensorReadingController';
import ClassificationResultController from '../app/controllers/ClassificationResultController';
import WeatherReadingController from '../app/controllers/WeatherReadingController';
import { uploadUserImage, uploadDeviceImage } from '../app/controllers/UploadController';
import UserController from '../app/controllers/UserController';
import SystemSettingController from '../app/controllers/SystemSettingController';
import TelegramLogController from '../app/controllers/TelegramLogController';
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to check auth from JWT
const authMiddleware = async (req: any, res: any, next: any) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }
};

// Auth Routes
router.post('/login', (req, res) => AuthController.login(req, res));
router.post('/register', (req, res) => AuthController.register(req, res));

// Public routes
router.post('/sensor-readings', (req, res) => SensorReadingController.store(req, res));
router.get('/public-devices', (req, res) => DeviceController.publicIndex(req, res));
router.get('/weather', (req, res) => WeatherReadingController.index(req, res));
router.get('/weather/latest', (req, res) => WeatherReadingController.latest(req, res));
router.post('/weather', (req, res) => WeatherReadingController.store(req, res));
router.post('/telegram/webhook', (req, res) => TelegramLogController.webhook(req, res));

// Protected routes
router.use(authMiddleware);

router.post('/logout', (req, res) => AuthController.logout(req, res));
router.post('/me', (req, res) => AuthController.me(req, res));
router.post('/change-password', (req, res) => AuthController.changePassword(req, res));

router.get('/devices', (req, res) => DeviceController.index(req, res));
router.post('/devices', uploadDeviceImage, (req, res) => DeviceController.store(req, res));
router.get('/devices/:id', (req, res) => DeviceController.show(req, res));
router.post('/devices/:id', uploadDeviceImage, (req, res) => DeviceController.update(req, res));
router.delete('/devices/:id', (req, res) => DeviceController.destroy(req, res));

router.get('/users', (req, res) => UserController.index(req, res));
router.post('/users', uploadUserImage, (req, res) => UserController.store(req, res));
router.get('/users/:id', (req, res) => UserController.show(req, res));
router.post('/users/:id', uploadUserImage, (req, res) => UserController.update(req, res));
router.put('/users/:id', uploadUserImage, (req, res) => UserController.update(req, res));
router.patch('/users/:id', uploadUserImage, (req, res) => UserController.update(req, res));
router.delete('/users/:id', (req, res) => UserController.destroy(req, res));
router.post('/users/:id/devices', (req, res) => UserController.attachDevice(req, res));
router.delete('/users/:id/devices/:deviceId', (req, res) => UserController.detachDevice(req, res));

router.get('/sensor-readings', (req, res) => SensorReadingController.index(req, res));
router.get('/sensor-readings/:id', (req, res) => SensorReadingController.show(req, res));

router.get('/classification-results', (req, res) => ClassificationResultController.index(req, res));
router.post('/classification-results', (req, res) => ClassificationResultController.store(req, res));
router.get('/classification-results/:id', (req, res) => ClassificationResultController.show(req, res));

// System Settings
router.get('/system-settings', (req, res) => SystemSettingController.index(req, res));
router.post('/system-settings/get-many', (req, res) => SystemSettingController.getMany(req, res));
router.post('/system-settings/:key', (req, res) => SystemSettingController.update(req, res));

// Telegram Logs
router.get('/telegram-logs', (req, res) => TelegramLogController.index(req, res));
router.post('/telegram-logs/set-webhook', (req, res) => TelegramLogController.setWebhook(req, res));
router.post('/telegram-logs/set-commands', (req, res) => TelegramLogController.setCommands(req, res));
router.post('/telegram-logs/send-test', (req, res) => TelegramLogController.sendTest(req, res));
router.delete('/telegram-logs/:id', (req, res) => TelegramLogController.destroy(req, res));

export default router;
