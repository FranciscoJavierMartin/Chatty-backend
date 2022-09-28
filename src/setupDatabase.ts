import mongoose from 'mongoose';

export default function setupDatabase() {
  function connect() {
    mongoose
      .connect('mongodb://localhost:27017/chatty')
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
