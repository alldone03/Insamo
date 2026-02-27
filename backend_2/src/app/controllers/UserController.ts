import { Request, Response } from 'express';
import { Controller } from './Controller';
import { db } from '../../config/database';
import { users, deviceUser, roles, devices } from '../models/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export class UserController extends Controller {
    // GET /api/users
    async index(req: Request, res: Response) {
        try {
            const allUsers = await db.select({
                id: users.id,
                name: users.name,
                email: users.email,
                image: users.image,
                roleId: users.roleId,
                telegramChatId: users.telegramChatId,
                createdAt: users.createdAt,
            }).from(users);

            return this.sendResponse(res, allUsers, 'Users retrieved successfully');
        } catch (error: any) {
             console.error('Fetch Users Error:', error);
             return this.sendError(res, 'Failed to fetch users');
        }
    }

    // POST /api/users
    async store(req: Request, res: Response) {
        try {
            const { name, email, password, role_id, telegram_chat_id } = req.body;

            if (!name || !email || !password) {
                return this.sendError(res, 'Name, email, and password are required', 400);
            }

            const existingUser = await db.query.users.findFirst({
                where: eq(users.email, email)
            });

            if (existingUser) {
                return this.sendError(res, 'User with this email already exists', 400);
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const [result] = await db.insert(users).values({
                name,
                email,
                password: hashedPassword,
                roleId: role_id ? Number(role_id) : null,
                telegramChatId: telegram_chat_id || null,
            });

            const newUser = await db.query.users.findFirst({
                where: eq(users.id, Number(result.insertId))
            });

            if (newUser) {
                const { password: _, ...userWithoutPassword } = newUser;
                return this.sendResponse(res, userWithoutPassword, 'User created successfully', 201);
            }
            return this.sendError(res, 'User created but could not retrieve', 500);

        } catch (error: any) {
            console.error('Create User Error:', error);
            return this.sendError(res, 'Failed to create user');
        }
    }

    // GET /api/users/:id
    async show(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = await db.query.users.findFirst({
                where: eq(users.id, Number(id))
            });

            if (!user) {
                return this.sendError(res, 'User not found', 404);
            }
            
            // Get attached devices
            const userDevices = await db.select({
                device: devices
            })
            .from(deviceUser)
            .innerJoin(devices, eq(deviceUser.device_id, devices.id))
            .where(eq(deviceUser.user_id, Number(id)));

            const { password: _, ...userWithoutPassword } = user;
            
            return this.sendResponse(res, {
                ...userWithoutPassword,
                devices: userDevices.map(ud => ud.device)
            }, 'User retrieved successfully');
        } catch (error: any) {
            console.error('Show User Error:', error);
            return this.sendError(res, 'Failed to fetch user');
        }
    }

    // PUT/POST /api/users/:id
    async update(req: any, res: Response) {
        try {
            const { id } = req.params;
            const { _method, ...updateFields } = req.body;
            
            const allowedFields = ['name', 'email', 'telegramChatId', 'telegram_chat_id', 'role_id'];
            const dataToUpdate: any = {};
            
            Object.keys(updateFields).forEach(key => {
                if (allowedFields.includes(key)) {
                    if (key === 'telegram_chat_id') {
                         dataToUpdate['telegramChatId'] = updateFields[key];
                    } else if (key === 'role_id') {
                         dataToUpdate['roleId'] = updateFields[key] ? Number(updateFields[key]) : null;
                    } else {
                         dataToUpdate[key] = updateFields[key];
                    }
                }
            });

            // Handle uploaded photo
            if (req.file) {
                dataToUpdate.image = `/uploads/users/${req.file.filename}`;
            }

            // If updating password
            if (updateFields.password) {
                dataToUpdate.password = await bcrypt.hash(updateFields.password, 10);
            }

            if (Object.keys(dataToUpdate).length === 0) {
                return this.sendResponse(res, null, 'No fields to update', 200);
            }

            await db.update(users)
                .set(dataToUpdate)
                .where(eq(users.id, Number(id)));
                
            const updatedUser = await db.query.users.findFirst({
                where: eq(users.id, Number(id))
            });

            if (updatedUser) {
                 const { password: _, ...userWithoutPassword } = updatedUser;
                 return this.sendResponse(res, userWithoutPassword, 'User updated successfully');
            } else {
                 return this.sendError(res, 'User not found', 404);
            }
        } catch (error: any) {
            console.error('Update User Error:', error);
            return this.sendError(res, 'Failed to update user');
        }
    }

    // DELETE /api/users/:id
    async destroy(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await db.delete(users).where(eq(users.id, Number(id)));
            return res.status(204).send();
        } catch (error: any) {
            console.error('Delete User Error:', error);
            return this.sendError(res, 'Failed to delete user');
        }
    }

    // POST /api/users/:id/devices
    async attachDevice(req: Request, res: Response) {
         try {
             const { id } = req.params;
             const { device_id } = req.body;

             if (!device_id) {
                 return this.sendError(res, 'device_id is required', 400);
             }

             // Check if already attached
             const existing = await db.select().from(deviceUser)
                .where(and(
                    eq(deviceUser.user_id, Number(id)), 
                    eq(deviceUser.device_id, Number(device_id))
                )).limit(1);

             if (existing.length === 0) {
                 await db.insert(deviceUser).values({
                     user_id: Number(id),
                     device_id: Number(device_id)
                 });
             }

             return this.sendResponse(res, null, 'Device attached successfully');
         } catch (error: any) {
             console.error('Attach Device Error:', error);
             return this.sendError(res, 'Failed to attach device');
         }
    }

    // DELETE /api/users/:id/devices/:deviceId
    async detachDevice(req: Request, res: Response) {
         try {
             const { id, deviceId } = req.params;

             await db.delete(deviceUser)
                .where(and(
                    eq(deviceUser.user_id, Number(id)),
                    eq(deviceUser.device_id, Number(deviceId))
                ));

             return this.sendResponse(res, null, 'Device detached successfully');
         } catch (error: any) {
             console.error('Detach Device Error:', error);
             return this.sendError(res, 'Failed to detach device');
         }
    }
}

export default new UserController();
