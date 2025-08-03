const request = require('supertest');
const index = require('../app'); 

describe('Task Endpoints', () => {
  let taskId = null;

  test('Create a new task', async () => {
    const res = await request(index)
      .post('/api/tasks')
      .send({
        columnId: 'todo',
        title: 'Integrated Test Task',
        description: 'Initial description',
        due: '2025-08-10',
        tags: ['test', 'urgent'],
        assignee_ids: [],
        priority: 'High'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('task');
    expect(res.body.task.title).toBe('Integrated Test Task');
    taskId = res.body.task.id; // Save task ID for next tests
  });

  test('Fetch all tasks', async () => {
    const res = await request(index).get('/api/tasks');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(task => task.id === taskId)).toBe(true);
  });

  test('Update the task', async () => {
    const res = await request(index)
      .put(`/api/tasks/${taskId}`)
      .send({
        title: 'Updated Test Task',
        description: 'Updated description',
        due: '2025-08-20',
        tags: ['updated'],
        assignee_ids: [],
        priority: 'Medium'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/updated successfully/i);
  });

  test('Move the task to another column', async () => {
    const res = await request(index)
      .put(`/api/tasks/${taskId}/move`)
      .send({
        sourceColumnId: 'todo',
        destColumnId: 'inprogress',
        newIndex: 0
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/moved successfully/i);
  });

  test('Delete the task', async () => {
    const res = await request(index).delete(`/api/tasks/${taskId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/i);
  });
});
