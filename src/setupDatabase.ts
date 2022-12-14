import mongoose from 'mongoose';
import Logger from 'bunyan';
import { config } from '@root/config';
import { redisConnection } from '@service/redis/reddis.connection';

const log: Logger = config.createLogger('database');

export default function setupDatabase() {
  function connect() {
    mongoose
      .connect(config.DATABASE_URL)
      .then(() => {
        log.info('Succesfully connected to database');
        redisConnection.connect();
      })
      .catch((error) => {
        log.error('Error connecting to database', error);
        process.exit(1);
      });
  }

  connect();

  mongoose.connection.on('disconnected', connect);
}
