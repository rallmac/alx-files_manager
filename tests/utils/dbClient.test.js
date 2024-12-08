const redisClient = require('../../utils/redis');

describe('Redis Client', () => {
  it('should set and get values', async () => {
    await redisClient.set('key', 'value');
    const result = await redisClient.get('key');
    expect(result).toBe('value');
  });

  it('should delete keys', async () => {
    await redisClient.set('key', 'value');
    await redisClient.del('key');
    const result = await redisClient.get('key');
    expect(result).toBe(null);
  });
});

