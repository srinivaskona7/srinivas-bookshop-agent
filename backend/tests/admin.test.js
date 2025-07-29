import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import app from '../server.js';

let mongoServer;

/*
 * Admin API tests
 *
 * This suite covers endpoints that are restricted to admin users. It verifies
 * that non‑admins cannot access these endpoints, that admins can view and
 * modify user roles, and that admins can create new books with file uploads.
 * An in‑memory MongoDB instance is used, and after each test the database
 * is cleared.
 */

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'testsecret';
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

async function registerUser(username, email) {
  return request(app)
    .post('/api/auth/register')
    .send({
      firstName: 'User',
      lastName: 'Last',
      username,
      email,
      password: 'password123',
    });
}

async function loginUser(username) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username, password: 'password123' });
  return res.body.token;
}

describe('Admin API', () => {
  test('Non‑admin user cannot access admin endpoints', async () => {
    // First user becomes admin; second becomes regular user
    await registerUser('adminuser', 'admin@example.com');
    await registerUser('regular', 'regular@example.com');
    const token = await loginUser('regular');
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('Admin can list users', async () => {
    await registerUser('adminuser', 'admin@example.com');
    await registerUser('user1', 'user1@example.com');
    const adminToken = await loginUser('adminuser');
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    // Should return at least two users (admin + user1)
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test('Admin can update user role', async () => {
    await registerUser('adminuser', 'admin@example.com');
    const userRes = await registerUser('user2', 'user2@example.com');
    const userId = userRes.body.user.id;
    const adminToken = await loginUser('adminuser');
    const updateRes = await request(app)
      .put(`/api/admin/users/${userId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.role).toBe('admin');
  });

  test('Admin can create a book with files', async () => {
    // Register admin user
    await registerUser('adminuser', 'admin@example.com');
    const adminToken = await loginUser('adminuser');

    // Create dummy cover and pdf buffers
    const coverBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAn8BHThEX7wAAAAASUVORK5CYII=',
      'base64'
    );
    // Minimal PDF content
    const pdfBuffer = Buffer.from(
      '%PDF-1.1\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(Hello) Tj\nET\nendstream\nendobj\ntrailer\n<< /Root 1 0 R /Size 5 >>\n%%EOF',
      'utf-8'
    );

    const res = await request(app)
      .post('/api/admin/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', 'Test Book')
      .field('author', 'Author Name')
      .field('description', 'A short description')
      .field('price', '9.99')
      .attach('cover', coverBuffer, { filename: 'cover.png', contentType: 'image/png' })
      .attach('pdf', pdfBuffer, { filename: 'book.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('title', 'Test Book');
    expect(res.body).toHaveProperty('coverImageUrl');
    expect(res.body).toHaveProperty('bookFileUrl');

    // Verify that the book appears in GET /api/books
    const booksRes = await request(app)
      .get('/api/books')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(booksRes.status).toBe(200);
    expect(booksRes.body.length).toBe(1);
    expect(booksRes.body[0].title).toBe('Test Book');
  });
});