import { describe, it, expect } from 'vitest';
import request from 'supertest';

// Use the running server URL
const API_URL = 'http://localhost:3000';

describe('Authentication API Tests', () => {
    const testUser = {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`, // Unique email for each run
        password: 'password123'
    };

    let authToken = '';

    it('should register a new user successfully', async () => {
        const response = await request(API_URL)
            .post('/api/register')
            .send(testUser);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.user).toHaveProperty('id');
        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.authorisation).toHaveProperty('token');
        
        // Save token for subsequent tests
        authToken = response.body.authorisation.token;
    });

    it('should fail to register an existing user', async () => {
        const response = await request(API_URL)
            .post('/api/register')
            .send(testUser);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('exists');
    });

    it('should login successfully with correct credentials', async () => {
        const response = await request(API_URL)
            .post('/api/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.authorisation).toHaveProperty('token');
        
        // Update token (though it should be the same logic)
        authToken = response.body.authorisation.token;
    });

    it('should fail login with incorrect password', async () => {
        const response = await request(API_URL)
            .post('/api/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Invalid credentials');
    });

    it('should successfully get "me" data with valid token', async () => {
        const response = await request(API_URL)
            .post('/api/me')
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.email).toBe(testUser.email);
    });

    it('should fail to get "me" data with invalid token', async () => {
        const response = await request(API_URL)
            .post('/api/me')
            .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    it('should fail to get "me" data without token', async () => {
        const response = await request(API_URL)
            .post('/api/me');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('No token provided');
    });
});
