import { UserModel } from '@user/models/user.schema';
import mongoose from 'mongoose';

class BlockUserService {
  public async blockUser(userId: string, followerId: string): Promise<void> {
    await Promise.all([
      UserModel.findOneAndUpdate(
        {
          _id: userId,
          blocked: { $ne: new mongoose.Types.ObjectId(followerId) },
        },
        {
          $push: {
            blocked: new mongoose.Types.ObjectId(followerId),
          },
        }
      ),
      UserModel.findOneAndUpdate(
        {
          _id: followerId,
          blockedBy: { $ne: new mongoose.Types.ObjectId(userId) },
        },
        {
          $push: {
            blockedBy: new mongoose.Types.ObjectId(userId),
          },
        }
      ),
    ]);
  }

  public async unblockUser(userId: string, followerId: string): Promise<void> {
    await Promise.all([
      UserModel.findOneAndUpdate(
        {
          _id: userId,
          blocked: new mongoose.Types.ObjectId(followerId),
        },
        {
          $pull: {
            blocked: new mongoose.Types.ObjectId(followerId),
          },
        }
      ),
      UserModel.findOneAndUpdate(
        {
          _id: followerId,
          blockedBy: new mongoose.Types.ObjectId(userId),
        },
        {
          $pull: {
            blockedBy: new mongoose.Types.ObjectId(userId),
          },
        }
      ),
    ]);
  }
}

export const blockUserService: BlockUserService = new BlockUserService();
