import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import app from '../server.js';

let mongoServer;

/*
 * User API tests
 *
 * These tests verify the endpoints that allow an authenticated user to
 * retrieve and update their profile. They run against an in‑memory
 * MongoDB instance to ensure isolation and repeatability. Before any
 * tests run, the MongoMemoryServer is started, and mongoose connects to
 * it. After all tests, the connection and server are torn down, and the
 * collections are cleared between tests. The JWT secret is set to a
 * known value for token verification.
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

async function registerAndLogin(username, email) {
  await request(app)
    .post('/api/auth/register')
    .send({
      firstName: 'Test',
      lastName: 'User',
      username,
      email,
      password: 'password123',
    });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username, password: 'password123' });
  return loginRes.body.token;
}

describe('User API', () => {
  test('Get current user requires authentication', async () => {
    const res = await request(app).get('/api/users/me');
    // Without a token, should return 401
    expect(res.status).toBe(401);
  });

  test('Get current user returns user details when authenticated', async () => {
    const token = await registerAndLogin('user1', 'user1@example.com');
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('username', 'user1');
    expect(res.body).toHaveProperty('email', 'user1@example.com');
    // Ensure password is not returned
    expect(res.body).not.toHaveProperty('password');
  });

  test('Update current user profile with JSON body', async () => {
    const token = await registerAndLogin('user2', 'user2@example.com');
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        passwordHint: 'hint',
      });
    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe('Updated');
    expect(res.body.lastName).toBe('Name');
    expect(res.body.email).toBe('updated@example.com');
    expect(res.body.passwordHint).toBe('hint');
  });
});