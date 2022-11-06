import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { config } from '@root/config';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { addImageSchema } from '@image/schemes/images';
import { UserCache } from '@service/redis/user.cache';
import { UploadApiResponse } from 'cloudinary';
import { uploads } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';
import { UserDocument } from '@user/interfaces/user.interface';
import { socketIOImageObject } from '@socket/image';
import { imageQueue } from '@service/queues/image.queue';

const userCache: UserCache = new UserCache();

export class Add {
  @joiValidation(addImageSchema)
  public async profileImage(req: Request, res: Response): Promise<void> {
    const result: UploadApiResponse = (await uploads(
      req.body.image,
      req.currentUser!.userId,
      true,
      true
    )) as UploadApiResponse;

    if (!result?.public_id) {
      throw new BadRequestError('File uplaod: Error ocurred. Try again');
    }

    const url = `https://res.cloudinary.com/${config.CLOUDINARY_CLOUD_NAME}/image/upload/v${result.version}/${result.public_id}`;
    const cachedUser: UserDocument | null =
      await userCache.updateSingleUserItemInCache(
        req.currentUser!.userId,
        'profilePicture',
        url
      );

    socketIOImageObject.emit('update user', cachedUser);

    imageQueue.addImageJob('addUserProfileImageToDB', {
      key: req.currentUser!.userId,
      value: url,
      imgId: result.public_id,
      imgVersion: result.version.toString(),
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Image added successfully' });
  }
}
