import { Request, Response } from 'express';
import { Controller } from './Controller';
import { db } from '../../config/database';
import { users } from '../models/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '1d';

export class AuthController extends Controller {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return this.sendError(res, 'Missing required fields', 400);
      }

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (existingUser) {
        return this.sendError(res, 'User with this email already exists', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const [result] = await db.insert(users).values({
        email,
        password: hashedPassword,
        name,
      });

      // Fetch the created user
      const newUser = await db.query.users.findFirst({
        where: eq(users.id, Number(result.insertId))
      });

      if (!newUser) throw new Error('Failed to retrieve newly created user');

      // Generate JWT for the new user
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, name: newUser.name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const { password: _, ...userWithoutPassword } = newUser;
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: userWithoutPassword,
        authorisation: {
          token,
          type: 'bearer'
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      return this.sendError(res, error.message || 'Registration failed');
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return this.sendError(res, 'Email and password are required', 400);
      }

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (!user || !user.password) {
        return this.sendError(res, 'Invalid credentials', 401);
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return this.sendError(res, 'Invalid credentials', 401);
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Return user and token
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: userWithoutPassword,
        authorisation: {
          token,
          type: 'bearer'
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return this.sendError(res, error.message || 'Login failed', 401);
    }
  }

  async me(req: Request, res: Response) {
    try {
        // req.user should be populated by authMiddleware
        const userId = (req as any).user?.id;
        
        if (!userId) {
            return this.sendError(res, 'Unauthorized', 401);
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId)
        });

        if (!user) {
            return this.sendError(res, 'User not found', 404);
        }

        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({
            ...userWithoutPassword,
            success: true
        });
    } catch (error: any) {
        return this.sendError(res, 'Failed to fetch user data', 500);
    }
  }

  async logout(req: Request, res: Response) {
      // For JWT, logout is usually handled on the client by deleting the token.
      // We can just return success here.
      return this.sendResponse(res, null, 'Logged out successfully');
  }
}

export default new AuthController();
