import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import mime from 'mime';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  /**
   * POST /files
   * Upload a new file or create a folder
   */
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tokenKey = `auth_${token}`;
    const userId = await redisClient.get(tokenKey);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId = '0', isPublic = false, data } = req.body;

    // Validate request parameters
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Handle parentId validation
    let parentFile = null;
    if (parentId !== '0') {
      parentFile = await dbClient.db.collection('files').findOne({ _id: new ObjectId(parentId) });

      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileData = {
      userId: new ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === '0' ? '0' : new ObjectId(parentId),
    };

    // Handle file or image type
    if (type === 'file' || type === 'image') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const localPath = path.join(folderPath, uuidv4());

      // Ensure the directory exists
      fs.mkdirSync(folderPath, { recursive: true });

      // Save the file data to the disk
      try {
        fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
      } catch (err) {
        return res.status(500).json({ error: 'Cannot save the file' });
      }

      fileData.localPath = localPath;
    }

    // Insert file into the database
    try {
      const result = await dbClient.db.collection('files').insertOne(fileData);
      fileData.id = result.insertedId;
      fileData.localPath = undefined; // Do not return localPath in the response

      return res.status(201).json(fileData);
    } catch (err) {
      return res.status(500).json({ error: 'Error creating the file' });
    }
  }
}

export default FilesController;
