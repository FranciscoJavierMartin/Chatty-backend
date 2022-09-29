import dotenv from 'dotenv';
import bunyan from 'bunyan';

dotenv.config({});

class Config {
  public DATABASE_URL: string;
  public JWT_TOKEN: string;
  public NODE_ENV: string;
  public COOKIE_KEY_ONE: string;
  public COOKIE_KEY_TWO: string;
  public CLIENT_URL: string;
  public PORT: string;
  public REDIS_HOST: string;

  constructor() {
    this.DATABASE_URL = process.env.DATABASE_URL!;
    this.JWT_TOKEN = process.env.JWT_TOKEN!;
    this.NODE_ENV = process.env.NODE_ENV!;
    this.COOKIE_KEY_ONE = process.env.COOKIE_KEY_ONE!;
    this.COOKIE_KEY_TWO = process.env.COOKIE_KEY_TWO!;
    this.CLIENT_URL = process.env.CLIENT_URL!;
    this.PORT = process.env.PORT!;
    this.REDIS_HOST = process.env.REDIS_HOST!;
  }

  public createLogger(name: string): bunyan {
    return bunyan.createLogger({ name, level: 'debug' });
  }

  public validateConfig(): void {
    Object.entries(this).forEach(([key, value]) => {
      if (!value) {
        throw new Error(`Missing ${key}`);
      }
    });
  }
}

export const config: Config = new Config();
