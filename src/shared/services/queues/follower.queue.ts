import { BaseQueue } from '@service/queues/base.queue';
import { followerWorker } from '@worker/follower.worker';
import { FollowerJobData } from '@follower/interfaces/follower.interface';

class FollowerQueue extends BaseQueue {
  constructor() {
    super('follower');
    this.processJob('addFollowerToDB', 5, followerWorker.addFollowerToDB);
    this.processJob(
      'removeFollowerFromDB',
      5,
      followerWorker.removeFollowerFromDB
    );
  }

  public addFollowerJob(name: string, data: FollowerJobData): void {
    this.addJob(name, data);
  }
}

export const followerQueue: FollowerQueue = new FollowerQueue();
