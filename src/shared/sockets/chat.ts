import { SenderReceiver } from '@chat/interfaces/chat.interface';
import { Server, Socket } from 'socket.io';
import { connectedUsers } from '@socket/user';

export let socketIOChatObject: Server;

export class SocketIOChatHandler {
  constructor(private io: Server) {
    socketIOChatObject = this.io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('join room', (data: SenderReceiver) => {
        const { senderName, receiverName } = data;
        const senderSocketId: string = connectedUsers.get(senderName)!;
        const receiverSocketId: string = connectedUsers.get(receiverName)!;
        socket.join(senderSocketId);
        socket.join(receiverSocketId);
      });
    });
  }
}
