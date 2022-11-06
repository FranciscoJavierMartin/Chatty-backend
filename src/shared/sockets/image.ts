import { Server } from 'socket.io';

export let socketIOImageObject: Server;

export class SocketIOImageHandler {
  constructor(io: Server) {
    socketIOImageObject = io;
  }
}
