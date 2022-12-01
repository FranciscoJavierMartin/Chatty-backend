import { Server, Socket } from 'socket.io';
import { Login, SocketData } from '@user/interfaces/user.interface';

export let socketIOUserObject: Server;
export const connectedUsers: Map<string, string> = new Map<string, string>();
let users: string[] = [];

export class SocketIOUserHandler {
  constructor(private io: Server) {
    socketIOUserObject = this.io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('setup', (data: Login) => {
        this.addClientToMap(data.userId, socket.id);
      });

      socket.on('block user', (data: SocketData) => {
        this.io.emit('blocked user id', data);
      });

      socket.on('unblock user', (data: SocketData) => {
        this.io.emit('unblocked user id', data);
      });

      socket.on('disconnect', () => {
        this.removeClientFromMap(socket.id);
      });
    });
  }

  private addClientToMap(userId: string, socketId: string): void {
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, socketId);
    }
  }

  private removeClientFromMap(socketId: string): void {
    const connectedUsersArray = [...connectedUsers.entries()];

    const disconnectedUser = connectedUsersArray.find(
      (connectedUser) => connectedUser[1] === socketId
    );

    if (disconnectedUser) {
      connectedUsers.delete(disconnectedUser[0]);
      this.removeUser(disconnectedUser[0]);
      this.io.emit('user online', users);
    }
  }

  private addUser(username: string): void {
    users.push(username);
    users = [...new Set(users)];
  }

  private removeUser(username: string): void {
    users = users.filter((user: string) => user !== username);
  }
}
