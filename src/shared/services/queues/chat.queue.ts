import { ChatJobData, MessageData } from '@chat/interfaces/chat.interface';
import { BaseQueue } from '@service/queues/base.queue';
import { chatWorker } from '@worker/chat.worker';

class ChatQueue extends BaseQueue {
  constructor() {
    super('chat');
    this.processJob('addChatMessageToDB', 5, chatWorker.addChatMessageToDB);
  }

  public addChatJob(name: string, data: ChatJobData | MessageData): void {
    this.addJob(name, data);
  }
}

export const chatQueue: ChatQueue = new ChatQueue();
