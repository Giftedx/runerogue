import request from 'supertest';
import app from '../src/index';

describe('Auth Service', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        service: 'auth-service',
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Auth Endpoints', () => {
    const testUser = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Test123456',
    };

    describe('POST /api/auth/register', () => {
      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
      });

      it('should validate email format', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'invalid-email',
            username: 'testuser',
            password: 'Test123456',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should validate password strength', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            username: 'testuser',
            password: 'weak',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
      });

      it('should reject invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'wrongpassword',
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid email or password');
      });
    });

    describe('GET /api/auth/validate', () => {
      it('should require authentication token', async () => {
        const response = await request(app)
          .get('/api/auth/validate')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Access token required');
      });

      it('should reject invalid token', async () => {
        const response = await request(app)
          .get('/api/auth/validate')
          .set('Authorization', 'Bearer invalid-token')
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid or expired token');
      });
    });

    describe('GET /api/auth/profile', () => {
      it('should require authentication token', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Access token required');
      });
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Route not found');
    });
  });
});