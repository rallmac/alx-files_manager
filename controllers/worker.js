import Queue from 'bull';
import dbClient from './utils/db';

const userQueue = new Queue('userQueue');

userQueue.process(async (job, done) => {
  const { userId } = job.data;

  if (!userId) {
    done(new Error('Missing userId'));
    return;
  }

  try {
    const user = await dbClient.db.collection('users').findOne({ _id: dbClient.ObjectID(userId) });

    if (!user) {
      done(new Error('User not found'));
      return;
    }

    console.log(`Welcome ${user.email}!`);
    // In real scenarios, integrate with Mailgun or any email service here.

    done();
  } catch (error) {
    done(error);
  }
});

