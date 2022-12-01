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
import { BgUploadResponse } from '@image/interfaces/image.interface';
import { Helpers } from '@global/helpers/helpers';

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

  @joiValidation(addImageSchema)
  public async backgroundImage(req: Request, res: Response): Promise<void> {
    const { version, publicId }: BgUploadResponse =
      await Add.prototype.backgroundUpload(req.body.image);

    const bgImageId: Promise<UserDocument | null> =
      userCache.updateSingleUserItemInCache(
        req.currentUser!.userId,
        'bgImageId',
        publicId
      );

    const bgImageVersion: Promise<UserDocument | null> =
      userCache.updateSingleUserItemInCache(
        req.currentUser!.userId,
        'bgImageVersion',
        version
      );

    const response = await Promise.all([bgImageId, bgImageVersion]);

    socketIOImageObject.emit('update user', {
      bgImageId: publicId,
      bgImageVersion: version,
      userId: response[0],
    });

    imageQueue.addImageJob('updateBGImageInDB', {
      key: req.currentUser!.userId,
      imgId: publicId,
      imgVersion: version,
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Image added successfully' });
  }

  private async backgroundUpload(image: string): Promise<BgUploadResponse> {
    const isDataURL = Helpers.isDataURL(image);
    let version: string;
    let publicId: string;

    if (isDataURL) {
      const result: UploadApiResponse = (await uploads(
        image
      )) as UploadApiResponse;
      if (result.public_id) {
        version = result.version.toString();
        publicId = result.public_id;
      } else {
        throw new BadRequestError(result.message);
      }
    } else {
      const value = image.split('/');
      version = value[value.length - 2];
      publicId = value[value.length - 1];
    }

    return { version: version.replace(/v/g, ''), publicId };
  }
}
