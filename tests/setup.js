const { MongoMemoryServer } = require('mongodb-memory-server');
const redis = require('redis-mock');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await dbClient.connect(uri);
});

afterAll(async () => {
  await dbClient.client.close();
  await mongoServer.stop();
});

beforeEach(() => {
  redisClient.client = redis.createClient();
});

afterEach(() => {
  redisClient.client.flushall();
});

