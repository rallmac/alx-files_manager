import Queue from 'bull';
import dbClient from '../utils/db';
import sha1 from 'sha1';

const userQueue = new Queue('userQueue');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const existingUser = await dbClient.db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const hashedPassword = sha1(password);
    const result = await dbClient.db.collection('users').insertOne({
      email,
      password: hashedPassword,
    });

    const newUser = { id: result.insertedId, email };

    // Add a job to the userQueue
    await userQueue.add({ userId: newUser.id.toString() });

    return res.status(201).json({ id: newUser.id, email });
  }
}

export default UsersController;

