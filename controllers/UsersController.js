import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  /**
   * POST /users
   * Create a new user in the database
   */
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Validate email and password
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Check if the user already exists
    const existingUser = await dbClient.db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    // Hash the password
    const hashedPassword = sha1(password);

    // Insert the new user into the database
    const result = await dbClient.db.collection('users').insertOne({
      email,
      password: hashedPassword,
    });

    // Respond with the created user's id and email
    return res.status(201).json({
      id: result.insertedId,
      email,
    });
  }

  /**
   * GET /users/me
   * Retrieve the authenticated user's information
   */
  static async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tokenKey = `auth_${token}`;
    const userId = await redisClient.get(tokenKey);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Respond with the user's id and email
    return res.status(200).json({
      id: user._id,
      email: user.email,
    });
  }
}

export default UsersController;
