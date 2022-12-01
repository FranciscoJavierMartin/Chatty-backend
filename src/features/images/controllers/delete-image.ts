import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { UserCache } from '@service/redis/user.cache';
import { UserDocument } from '@user/interfaces/user.interface';
import { socketIOImageObject } from '@socket/image';
import { imageQueue } from '@service/queues/image.queue';
import { imageService } from '@service/db/image.service';
import { FileImageDocument } from '@image/interfaces/image.interface';

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
    const image: FileImageDocument | null =
      await imageService.getImageByBackgroundId(req.params.bgImageId);
    socketIOImageObject.emit('delete image', image?._id);
    const bgImageId: Promise<UserDocument> =
      userCache.updateSingleUserItemInCache(
        `${req.currentUser!.userId}`,
        'bgImageId',
        ''
      ) as Promise<UserDocument>;
    const bgImageVersion: Promise<UserDocument> =
      userCache.updateSingleUserItemInCache(
        `${req.currentUser!.userId}`,
        'bgImageVersion',
        ''
      ) as Promise<UserDocument>;
    (await Promise.all([bgImageId, bgImageVersion])) as [
      UserDocument,
      UserDocument
    ];
    imageQueue.addImageJob('removeImageFromDB', {
      imageId: image?._id,
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Image deleted successfully' });
  }
}
