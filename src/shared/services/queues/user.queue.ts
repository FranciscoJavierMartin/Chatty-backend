import { BaseQueue } from '@service/queues/base.queue';
import { UserJob } from '@user/interfaces/user.interface';
import { userWorker } from '@worker/user.worker';

class UserQueue extends BaseQueue {
  constructor() {
    super('user');
    this.processJob('addUserToDB', 5, userWorker.addUserToDB);
    this.processJob('updateUserInfo', 5, userWorker.updateUserInfo);
    this.processJob('updateSocialLinks', 5, userWorker.updateSocialLinks);
  }

  public addUserJob(name: string, data: UserJob): void {
    this.addJob(name, data);
  }
}

export const userQueue: UserQueue = new UserQueue();
