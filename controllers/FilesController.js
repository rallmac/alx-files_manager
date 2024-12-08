import fs from 'fs/promises';
import path from 'path';
import { ObjectId } from 'mongodb';
import mime from 'mime-types';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  // POST /files - already implemented
  // GET /files/:id - already implemented
  // GET /files - already implemented

  /**
   * GET /files/:id/data
   * Return the content of a file based on its ID.
   */
  static async getFile(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    const fileId = req.params.id;
    const { size } = req.query; // Extract the size query parameter

    if (!ObjectId.isValid(fileId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Fetch the file document
    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Check if the file is public or if the user is the owner
    if (!file.isPublic && (!userId || String(file.userId) !== String(userId))) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Check if the file type is a folder
    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    // Verify the local file exists
    try {
      let filePath = file.localPath;

      // Handle the size query parameter for thumbnails
      if (size) {
        const validSizes = ['100', '250', '500']; // Valid thumbnail sizes
        if (!validSizes.includes(size)) {
          return res.status(400).json({ error: 'Invalid size parameter' });
        }

        const sizedFilePath = `${filePath}_${size}`;
        try {
          // Check if the size-specific file exists
          await fs.access(sizedFilePath);
          filePath = sizedFilePath; // Use the sized file if it exists
        } catch (err) {
          return res.status(404).json({ error: 'Not found' });
        }
      }

      const content = await fs.readFile(filePath);
      const mimeType = mime.lookup(file.name) || 'application/octet-stream';

      // Set the Content-Type header and return the file content
      res.set('Content-Type', mimeType);
      return res.status(200).send(content);
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }
  }
}

export default FilesController;
