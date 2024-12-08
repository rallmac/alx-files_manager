const request = require('supertest');
const app = require('../../app'); // Assuming this is your Express app entry point
const dbClient = require('../../utils/db');
const redisClient = require('../../utils/redis');

describe('API Endpoints', () => {
  beforeEach(async () => {
    // Clear the database and Redis before each test
    await dbClient.db.collection('users').deleteMany({});
    await dbClient.db.collection('files').deleteMany({});
    redisClient.client.flushall();
  });

  it('GET /status should return status', async () => {
    const res = await request(app).get('/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ redis: true, db: true });
  });

  it('GET /stats should return stats', async () => {
    const res = await request(app).get('/stats');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ users: 0, files: 0 });
  });

  it('POST /users should create a new user', async () => {
    const res = await request(app).post('/users').send({ email: 'test@example.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('GET /connect should authenticate a user', async () => {
    const user = { email: 'test@example.com', password: 'password123' };
    await request(app).post('/users').send(user);
    const credentials = Buffer.from(`${user.email}:${user.password}`).toString('base64');
    const res = await request(app).get('/connect').set('Authorization', `Basic ${credentials}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('GET /disconnect should disconnect a user', async () => {
    // Simulate a logged-in user
    const token = 'test-token';
    await redisClient.set(`auth_${token}`, '1');
    const res = await request(app).get('/disconnect').set('X-Token', token);
    expect(res.status).toBe(204);
  });

  it('GET /users/me should return the user profile', async () => {
    const user = { email: 'test@example.com', password: 'password123' };
    await request(app).post('/users').send(user);
    const credentials = Buffer.from(`${user.email}:${user.password}`).toString('base64');
    const connectRes = await request(app).get('/connect').set('Authorization', `Basic ${credentials}`);
    const token = connectRes.body.token;
    const res = await request(app).get('/users/me').set('X-Token', token);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email', user.email);
  });

  it('POST /files should upload a file', async () => {
    const user = { email: 'test@example.com', password: 'password123' };
    await request(app).post('/users').send(user);
    const credentials = Buffer.from(`${user.email}:${user.password}`).toString('base64');
    const connectRes = await request(app).get('/connect').set('Authorization', `Basic ${credentials}`);
    const token = connectRes.body.token;

    const res = await request(app)
      .post('/files')
      .set('X-Token', token)
      .send({ name: 'test.txt', type: 'file', data: Buffer.from('Hello, world!').toString('base64') });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  // Add similar tests for:
  // GET /files/:id
  // GET /files with pagination
  // PUT /files/:id/publish
  // PUT /files/:id/unpublish
  // GET /files/:id/data with/without size query
});

