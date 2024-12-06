import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

class DBClient {
  constructor() {
    // MongoDB connection parameters
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    // Initialize the MongoDB client
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.dbName = database;

    // Attempt to connect to the database
    this.client
      .connect()
      .then(() => {
        console.log('MongoDB connected successfully');
        this.db = this.client.db(this.dbName);
      })
      .catch((error) => {
        console.error('MongoDB connection failed:', error.message);
        this.db = null;
      });
  }

  /**
   * Check if the MongoDB client is connected
   * @returns {boolean} - True if connected, false otherwise
   */
  isAlive() {
    return this.db !== null && this.client.topology.isConnected();
  }

  /**
   * Get the number of users in the 'users' collection
   * @returns {Promise<number>} - Count of documents in 'users' collection
   */
  async nbUsers() {
    if (!this.isAlive()) return 0;
    return this.db.collection('users').countDocuments();
  }

  /**
   * Get the number of files in the 'files' collection
   * @returns {Promise<number>} - Count of documents in 'files' collection
   */
  async nbFiles() {
    if (!this.isAlive()) return 0;
    return this.db.collection('files').countDocuments();
  }
}

// Export a singleton instance of DBClient
const dbClient = new DBClient();
export default dbClient;
