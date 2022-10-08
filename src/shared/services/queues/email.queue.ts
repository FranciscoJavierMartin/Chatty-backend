import { BaseQueue } from '@service/queues/base.queue';
import { EmailJob } from '@user/interfaces/user.interface';

class EmailQueue extends BaseQueue {
  constructor() {
    super('emails');
  }

  public addEmailJob(name: string, data: EmailJob): void {
    this.addJob(name, data);
  }
}

export const emailQueue: EmailQueue = new EmailQueue();
