const request = require('supertest');
const app = require('../app'); 
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../db/copilot.db');

beforeAll((done) => {
  const db = new sqlite3.Database(dbPath);
  db.run('DELETE FROM users WHERE username LIKE "testuser%"', () => {
    db.close();
    done();
  });
});

describe('Auth Endpoints', () => {

  test('Register a new user', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'testuser1',
        email: 'testuser1@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully!');
    expect(res.body).toHaveProperty('userId');
  });

  test('Register with missing fields', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: '',
        email: '',
        password: '',
      });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  test('Login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'testuser1',
        password: 'password123',
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Login successful!');
    expect(res.body).toHaveProperty('token');
  });

  test('Login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'testuser1',
        password: 'wrongpass',
      });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
  });

  test('Login with missing credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

});
