import { AuthJob } from '@auth/interfaces/auth.interface';
import { BaseQueue } from '@service/queues/base.queue';

class AuthQueue extends BaseQueue {
  constructor() {
    super('auth');
  }

  public addAuthUserJob(name: string, data: AuthJob): void {
    this.addJob(name, data);
  }
}

export const authQueue: AuthQueue = new AuthQueue();
