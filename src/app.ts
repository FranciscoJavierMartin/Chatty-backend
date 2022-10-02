import express, { Express } from 'express';
import { config } from '@root/config';
import setupDatabase from '@root/setupDatabase';
import { ChattyServer } from '@root/setupServer';

class Application {
  public initialize(): void {
    this.loadConfig();
    setupDatabase();
    const app: Express = express();
    const server: ChattyServer = new ChattyServer(app);
    server.start();
  }

  private loadConfig(): void {
    config.validateConfig();
    config.setupCloudinary();
  }
}

const application: Application = new Application();
application.initialize();
