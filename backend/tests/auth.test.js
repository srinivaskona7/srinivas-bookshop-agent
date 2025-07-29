import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import app from '../server.js';

let mongoServer;

/*
 * Authentication API tests
 *
 * These tests verify the behaviour of the registration and login endpoints. An
 * in‑memory MongoDB instance is used to isolate the tests from any real
 * database. Before any tests run, the MongoMemoryServer is started and
 * mongoose is connected to it. After all tests complete, the connection
 * and server are torn down. Each test runs with a clean database, and the
 * JWT secret is set explicitly so that tokens can be verified consistently.
 */

beforeAll(async () => {
  // Ensure test environment variables are set before the app is imported.
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
  // Clear all collections after each test to ensure isolation.
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

describe('Auth API', () => {
  test('Register first user assigns admin role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        passwordHint: 'my hint',
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.username).toBe('johndoe');
    expect(res.body.user.role).toBe('admin');
  });

  test('Register second user assigns user role', async () => {
    // Register first admin user
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Admin',
        lastName: 'User',
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123',
      });
    // Register second normal user
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        password: 'password123',
      });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user');
  });

  test('Duplicate registration is rejected', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Alice',
        lastName: 'Wonderland',
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
      });
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Alice2',
        lastName: 'Wonderland2',
        username: 'alice', // duplicate username
        email: 'alice@example.com', // duplicate email
        password: 'password123',
      });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('Login with valid credentials returns token', async () => {
    // Register user
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Bob',
        lastName: 'Brown',
        username: 'bobbrown',
        email: 'bob@example.com',
        password: 'mypassword',
      });
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'bobbrown',
        password: 'mypassword',
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe('bobbrown');
  });

  test('Login with invalid credentials fails', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Charlie',
        lastName: 'Day',
        username: 'charlie',
        email: 'charlie@example.com',
        password: 'secret',
      });
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'charlie',
        password: 'wrongpassword',
      });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});