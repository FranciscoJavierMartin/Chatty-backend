import dotenv from 'dotenv';
import bunyan from 'bunyan';
import cloudinary from 'cloudinary';

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
  public CLOUDINARY_CLOUD_NAME: string;
  public CLOUDINARY_API_KEY: string;
  public CLOUDINARY_API_SECRET: string;
  public SENDER_EMAIL: string;
  public SENDER_EMAIL_PASSWORD: string;
  public SENDGRID_API_KEY: string;
  public SENDGRID_SENDER: string;
  public EC2_URL: string;

  constructor() {
    this.DATABASE_URL = process.env.DATABASE_URL!;
    this.JWT_TOKEN = process.env.JWT_TOKEN!;
    this.NODE_ENV = process.env.NODE_ENV!;
    this.COOKIE_KEY_ONE = process.env.COOKIE_KEY_ONE!;
    this.COOKIE_KEY_TWO = process.env.COOKIE_KEY_TWO!;
    this.CLIENT_URL = process.env.CLIENT_URL!;
    this.PORT = process.env.PORT!;
    this.REDIS_HOST = process.env.REDIS_HOST!;
    this.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
    this.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
    this.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;
    this.SENDER_EMAIL = process.env.SENDER_EMAIL!;
    this.SENDER_EMAIL_PASSWORD = process.env.SENDER_EMAIL_PASSWORD!;
    this.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY!;
    this.SENDGRID_SENDER = process.env.SENDGRID_SENDER!;
    this.EC2_URL = process.env.EC2_URL!;
  }

  public createLogger(name: string): bunyan {
    return bunyan.createLogger({ name, level: 'debug' });
  }

  public setupCloudinary(): void {
    cloudinary.v2.config({
      cloud_name: this.CLOUDINARY_CLOUD_NAME,
      api_key: this.CLOUDINARY_API_KEY,
      api_secret: this.CLOUDINARY_API_SECRET,
    });
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
