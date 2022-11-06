import mongoose from 'mongoose';
import { UserModel } from '@user/models/user.schema';
import { ImageModel } from '@image/models/image.schema';
import { FileImageDocument } from '@image/interfaces/image.interface';

class ImageService {
  public async addUserProfileImageToDB(
    userId: string,
    url: string,
    imgId: string,
    imgVersion: string
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      $set: { profilePicture: url },
    }).exec();
    await this.addImage(userId, imgId, imgVersion, 'profile');
  }

  public async addBackgroundImageToDB(
    userId: string,
    imgId: string,
    imgVersion: string
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      $set: { bgImageId: imgId, bgImageVersion: imgVersion },
    }).exec();
    await this.addImage(userId, imgId, imgVersion, 'background');
  }

  public async addImage(
    userId: string,
    imgId: string,
    imgVersion: string,
    type: 'background' | 'profile'
  ): Promise<void> {
    await ImageModel.create({
      userId,
      bgImageId: type === 'background' ? imgId : '',
      bgImageVersion: type === 'background' ? imgVersion : '',
      imageId: type === 'profile' ? imgId : '',
      imageVersion: type === 'profile' ? imgVersion : '',
    });
  }

  public async removeImageFromDB(imageId: string): Promise<void> {
    await ImageModel.findByIdAndRemove(imageId).exec();
  }

  public async getImageByBackgroundId(
    bgImageId: string
  ): Promise<FileImageDocument | null> {
    return await ImageModel.findOne({
      bgImageId,
    }).exec();
  }

  public async getImages(userId: string): Promise<FileImageDocument[]> {
    return await ImageModel.aggregate([{ $match: { userId } }]);
  }
}

export const imageService: ImageService = new ImageService();
