import { CommentDocument } from '@comment/interfaces/comment.interface';
import { ReactionDocument } from '@reaction/interfaces/reaction.interface';
import { Server, Socket } from 'socket.io';

export let socketIOPostObject: Server;

export class SocketIOPostHandler {
  constructor(private io: Server) {
    socketIOPostObject = this.io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('reaction', (reaction: ReactionDocument) => {
        this.io.emit('update like', reaction);
      });

      socket.on('comment', (comment: CommentDocument) => {
        this.io.emit('update comment', comment);
      });
    });
  }
}
