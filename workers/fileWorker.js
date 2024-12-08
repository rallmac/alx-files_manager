import Bull from 'bull';
import fs from 'fs/promises';
import path from 'path';
import imageThumbnail from 'image-thumbnail';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.db.collection('files').findOne({
    _id: new ObjectId(fileId),
    userId: new ObjectId(userId),
  });

  if (!file) {
    throw new Error('File not found');
  }

  const { localPath, type } = file;
  if (type !== 'image') {
    return;
  }

  const sizes = [500, 250, 100];
  for (const size of sizes) {
    try {
      const thumbnail = await imageThumbnail(localPath, { width: size });
      const thumbnailPath = `${localPath}_${size}`;
      await fs.writeFile(thumbnailPath, thumbnail);
    } catch (error) {
      console.error(`Failed to generate thumbnail for size ${size}:`, error);
    }
  }
});

