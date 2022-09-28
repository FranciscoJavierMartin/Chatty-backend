import mongoose from 'mongoose';
import { config } from './config';

export default function setupDatabase() {
  function connect() {
    mongoose
      .connect(config.DATABASE_URL)
      .then(() => {
        console.log('Succesfully connected to database');
      })
      .catch((error) => {
        console.log('Error connecting to database', error);
        process.exit(1);
      });
  }

  connect();

  mongoose.connection.on('disconnected', connect);
}
