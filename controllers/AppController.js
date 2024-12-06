import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  /**
   * GET /status
   * Return Redis and MongoDB connection status
   */
  static getStatus(req, res) {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    res.status(200).json(status);
  }

  /**
   * GET /stats
   * Return the number of users and files in the database
   */
  static async getStats(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    res.status(200).json({ users, files });
  }
}

export default AppController;
