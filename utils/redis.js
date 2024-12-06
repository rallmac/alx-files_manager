import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    // Properly formatted object with curly braces
    this.client = redis.createClient({
      host: '127.0.0.1',
      port: 6379,
    });

    // Log errors to the console
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    // Promisify Redis client methods
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    return this.getAsync(key);
  }

  async set(key, value, duration) {
    await this.setAsync(key, value, 'EX', duration);
  }

  async del(key) {
    await this.delAsync(key);
  }
}

// Export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
