import { Server, Socket } from 'socket.io';

let socketIOPostObject: Server;

export class SocketIOPostHandler {
  constructor(private io: Server) {
    socketIOPostObject = this.io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('Post socketio handler');
    });
  }
}
