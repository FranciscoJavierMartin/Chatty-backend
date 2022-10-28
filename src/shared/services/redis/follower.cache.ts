import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import { BaseCache } from '@service/redis/base.cache';

export class FollowerCache extends BaseCache {
  constructor() {
    super('FollowerCache');
  }

  public async saveFollowerToCache(key: string, value: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.client.LPUSH(key, value);
    } catch (error) {
      this.log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }
}
