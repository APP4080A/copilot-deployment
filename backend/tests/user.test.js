const request = require('supertest');
const app = require('../app');

let createdUserId;

describe('User Management Endpoints', () => {

  test('Register a new user', async () => {
    const res = await request(app).post('/api/register').send({
      username: 'TestUser123',
      email: 'testuser123@example.com',
      password: 'TestPassword123!'  
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/success/i);
    expect(res.body).toHaveProperty('userId');
    createdUserId = res.body.userId;
  });

  test('Fetch all users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Fetch user by ID', async () => {
    const res = await request(app).get(`/api/users/${createdUserId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', createdUserId);
  });

  test('Update user by ID', async () => {
    const res = await request(app).put(`/api/users/${createdUserId}`).send({
      username: 'UpdatedUser123',
      email: 'updateduser123@example.com',
      role: 'admin'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/updated successfully/i);
  });

  test('Delete user by ID', async () => {
    const res = await request(app).delete(`/api/users/${createdUserId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/i);
  });

  test('Fetch deleted user returns 404', async () => {
    const res = await request(app).get(`/api/users/${createdUserId}`);
    expect(res.statusCode).toBe(404);
  });

});
