import { FileImageJobData } from '@image/interfaces/image.interface';
import { BaseQueue } from '@service/queues/base.queue';
import { imageWorker } from '@worker/image.worker';

class ImageQueue extends BaseQueue {
  constructor() {
    super('image');
    this.processJob(
      'addUserProfileImageToDB',
      5,
      imageWorker.addUserProfileImageToDB
    );
    this.processJob('updateBGImageInDB', 5, imageWorker.updateBGImageInDB);
    this.processJob('addImageToDb', 5, imageWorker.addImageToDb);
    this.processJob('removeImageFromDB', 5, imageWorker.removeImageFromDB);
  }

  public addImageJob(name: string, data: FileImageJobData): void {
    this.addJob(name, data);
  }
}

export const imageQueue: ImageQueue = new ImageQueue();
