import { Server, Socket } from 'socket.io';
import { SocketData } from '@user/interfaces/user.interface';

export let socketIOUserObject: Server;

export class SocketIOUserHandler {
  constructor(private io: Server) {
    socketIOUserObject = this.io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('block user', (data: SocketData) => {
        this.io.emit('blocked user id', data);
      });

      socket.on('unblock user', (data: SocketData) => {
        this.io.emit('unblocked user id', data);
      });
    });
  }
}
