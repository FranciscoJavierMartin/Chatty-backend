import express, { Router, Request, Response } from 'express';
import moment from 'moment';
import axios from 'axios';
import { performance } from 'perf_hooks';
import HTTP_STATUS from 'http-status-codes';
import { config } from '@root/config';
import { plugin } from 'mongoose';

class HealthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public health(): Router {
    this.router.get('/health', (req: Request, res: Response) => {
      res
        .status(HTTP_STATUS.OK)
        .send(
          `Health: Server instance is healthy with process id ${
            process.pid
          } on ${moment().format('LL')}`
        );
    });

    return this.router;
  }

  public env(): Router {
    this.router.get('/env', (req: Request, res: Response) => {
      res
        .status(HTTP_STATUS.OK)
        .send(`This is the ${config.NODE_ENV} environment.`);
    });
    return this.router;
  }

  public instance(): Router {
    this.router.get('/instance', async (req: Request, res: Response) => {
      const response = await axios.get(config.EC2_URL);
      res
        .status(HTTP_STATUS.OK)
        .send(
          `Server is running on EC2 instance with id ${
            response.data
          } and process id ${process.pid} on ${moment().format('LL')}`
        );
    });

    return this.router;
  }

  public hardWork(): Router {
    this.router.get('/hardwork/:num', async (req: Request, res: Response) => {
      const num: number = +req.params.num;
      const start: number = performance.now();
      const result: number = this.fibonacci(num);
      const end: number = performance.now();

      const response = await axios.get(config.EC2_URL);

      res
        .status(HTTP_STATUS.OK)
        .send(
          `Fibonacci series of ${num} is ${result} and it took ${
            end - start
          } ms with EC2 instance of ${response.data} and process id ${
            process.pid
          } on ${moment().format('LL')}`
        );
    });

    return this.router;
  }

  private fibonacci(data: number): number {
    return data < 2 ? 1 : this.fibonacci(data - 2) + this.fibonacci(data - 1);
  }
}

export const healthRoutes: HealthRoutes = new HealthRoutes();
