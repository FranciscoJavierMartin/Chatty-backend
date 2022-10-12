import http from 'http';
import {
  Application,
  json,
  NextFunction,
  Request,
  Response,
  urlencoded,
} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieSession from 'cookie-session';
import compression from 'compression';
import HTTP_STATUS from 'http-status-codes';
import socket from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import Logger from 'bunyan';
import 'express-async-errors';
import { config } from '@root/config';
import setupRoutes from '@root/routes';
import { CustomError, ErrorResponse } from '@global/helpers/error-handler';
import { SocketIOPostHandler } from '@socket/post';

const log: Logger = config.createLogger('server');

export class ChattyServer {
  constructor(private app: Application) {}

  public start(): void {
    this.securityMiddlewares(this.app);
    this.standardMiddlewares(this.app);
    this.routeMiddlewares(this.app);
    this.globalErrorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddlewares(app: Application): void {
    app.use(
      cookieSession({
        name: 'session',
        keys: [config.COOKIE_KEY_ONE, config.COOKIE_KEY_TWO],
        maxAge: 24 * 7 * 3600,
        secure: config.NODE_ENV !== 'development',
      })
    );
    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        origin: config.CLIENT_URL,
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      })
    );
  }

  private standardMiddlewares(app: Application): void {
    app.use(compression());
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));
  }

  private routeMiddlewares(app: Application): void {
    setupRoutes(app);
  }

  private globalErrorHandler(app: Application): void {
    app.all('*', (req: Request, res: Response) => {
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ message: `${req.originalUrl} not found` });
    });

    app.use(
      (
        error: ErrorResponse,
        req: Request,
        res: Response,
        next: NextFunction
      ) => {
        log.error(error);

        if (error instanceof CustomError) {
          return res.status(error.statusCode).json(error.serializeErrors());
        }

        next();
      }
    );
  }

  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      const socketIO: socket.Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
      this.socketIOConnections(socketIO);
    } catch (error) {
      log.error(error);
    }
  }

  private async createSocketIO(
    httpServer: http.Server
  ): Promise<socket.Server> {
    const io: socket.Server = new socket.Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      },
    });

    const pubClient = createClient({ url: config.REDIS_HOST });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    return io;
  }

  private startHttpServer(httpServer: http.Server): void {
    log.info(`Server has started with process ${process.pid}`);
    httpServer.listen(config.PORT, () => {
      log.info(`Server running on port ${config.PORT}`);
    });
  }

  private socketIOConnections(io: socket.Server): void {
    const postSocketHandler: SocketIOPostHandler = new SocketIOPostHandler(io);

    postSocketHandler.listen();
  }
}
