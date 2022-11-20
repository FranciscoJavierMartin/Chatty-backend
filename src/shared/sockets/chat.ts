import { SenderReceiver } from '@chat/interfaces/chat.interface';
import { Server, Socket } from 'socket.io';

export let socketIOChatObject: Server;

export class SocketIOChatHandler {
  constructor(private io: Server) {
    socketIOChatObject = this.io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('join room', (data: SenderReceiver) => {
        console.log(data);
      });
    });
  }
}
