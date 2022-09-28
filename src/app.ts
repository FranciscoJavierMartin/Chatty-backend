import express, { Express } from 'express';
import { config } from './config';
import setupDatabase from './setupDatabase';
import { ChattyServer } from './setupServer';

class Application {
  public initialize(): void {
    config.validateConfig();
    setupDatabase();
    const app: Express = express();
    const server: ChattyServer = new ChattyServer(app);
    server.start();
  }
}

const application: Application = new Application();
application.initialize();
