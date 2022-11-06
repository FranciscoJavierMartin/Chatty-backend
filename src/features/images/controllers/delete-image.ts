import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { UserCache } from '@service/redis/user.cache';
import { UserDocument } from '@user/interfaces/user.interface';
import { socketIOImageObject } from '@socket/image';
import { imageQueue } from '@service/queues/image.queue';
import { imageService } from '@service/db/image.service';

const userCache: UserCache = new UserCache();

export class Delete {
  public async image(req: Request, res: Response): Promise<void> {
    const { imageId } = req.params;
    socketIOImageObject.emit('delete image', imageId);

    imageQueue.addImageJob('removeImageFromDB', {
      imageId,
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Image deleted successfully' });
  }

  public async backgroundImage(req: Request, res: Response): Promise<void> {
    const { bgImageId } = req.params;

    await imageService.removeImageFromDB(bgImageId);
    socketIOImageObject.emit('delete image', bgImageId);

    const bgImageIdPromise: Promise<UserDocument | null> =
      userCache.updateSingleUserItemInCache(
        req.currentUser!.userId,
        'bgImageId',
        ''
      );

    const bgImageVersionPromise: Promise<UserDocument | null> =
      userCache.updateSingleUserItemInCache(
        req.currentUser!.userId,
        'bgImageVersion',
        ''
      );

    await Promise.all([bgImageIdPromise, bgImageVersionPromise]);

    imageQueue.addImageJob('removeImageFromDB', {
      imageId: bgImageId,
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Image deleted successfully' });
  }
}
