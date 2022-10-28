import { Followers } from '@follower/interfaces/follower.interface';
import { Server, Socket } from 'socket.io';

export let socketIOFollowerObject: Server;

export class SocketIOFollowerHandler {
  constructor(private io: Server) {
    socketIOFollowerObject = this.io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('unfollow user', (data: Followers) => {
        this.io.emit('remove follower', data);
      });
    });
  }
}
