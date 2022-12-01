import { BaseQueue } from '@service/queues/base.queue';
import { BlockedUserJobData } from '@follower/interfaces/follower.interface';
import { blockedWorker } from '@worker/blocked.worker';

class BlockedUserQueue extends BaseQueue {
  constructor() {
    super('block');
    this.processJob('addBlockedUserToDB', 5, blockedWorker.addBlockedUserToDB);
  }

  public addBlockedUserJob(name: string, data: BlockedUserJobData): void {
    this.addJob(name, data);
  }
}

export const blockedUserQueue: BlockedUserQueue = new BlockedUserQueue();
