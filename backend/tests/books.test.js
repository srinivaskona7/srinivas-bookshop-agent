import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import app from '../server.js';

let mongoServer;

/*
 * Books API tests
 *
 * These tests cover retrieval of books by authenticated users. Creation of
 * books is tested in the admin suite, while here we only verify that the
 * endpoint returns an array and that authentication is required.
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

describe('Books API', () => {
  test('Get books requires authentication', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(401);
  });

  test('Get books returns empty array initially', async () => {
    const token = await registerAndLogin('bookuser', 'bookuser@example.com');
    const res = await request(app)
      .get('/api/books')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});