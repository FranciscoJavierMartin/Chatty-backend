import mongoose from 'mongoose';
import { PostModel } from '@post/models/post.schema';
import {
  QueryReaction,
  ReactionDocument,
  ReactionJob,
} from '@reaction/interfaces/reaction.interface';
import { ReactionModel } from '@reaction/models/reaction.schema';
import { UserCache } from '@service/redis/user.cache';
import { Helpers } from '@global/helpers/helpers';
import {
  NotificationDocument,
  NotificationTemplateParams,
} from '@notification/interfaces/notification.interface';
import { NotificationModel } from '@notification/models/notification.schema';
import { socketIONotificationObject } from '@socket/notification';
import { notificationTemplate } from '@service/emails/templates/notifications/notification-template';
import { emailQueue } from '@service/queues/email.queue';
import { UserDocument } from '@user/interfaces/user.interface';
import { PostDocument } from '@post/interfaces/post.interface';

const userCache: UserCache = new UserCache();

class ReactionService {
  public async addReactionDataToDB(reactionData: ReactionJob): Promise<void> {
    const {
      postId,
      userTo,
      userFrom,
      username,
      type,
      previousReaction,
      reactionObject,
    } = reactionData;

    const reactionObjectAux: ReactionDocument = {
      ...reactionObject,
    } as ReactionDocument;

    if (previousReaction && reactionObject) {
      delete reactionObjectAux._id;
    }

    const updatedReaction: [
      UserDocument | null,
      ReactionDocument,
      PostDocument
    ] = (await Promise.all([
      userCache.getUserFromCache(`${userTo}`),
      ReactionModel.replaceOne(
        { postId, type: previousReaction, username },
        reactionObjectAux,
        { upsert: true }
      ),
      PostModel.findOneAndUpdate(
        { _id: postId },
        {
          $inc: {
            [`reactions.${previousReaction}`]: -1,
            [`reactions.${type}`]: 1,
          },
        },
        { new: true }
      ),
    ])) as unknown as [UserDocument, ReactionDocument, PostDocument];

    if (updatedReaction[0]?.notifications.reactions && userTo !== userFrom) {
      const notificationModel: NotificationDocument = new NotificationModel();

      const notifications = await notificationModel.insertNotification({
        userFrom: userFrom!,
        userTo: userTo!,
        message: `${username} reacted to your post`,
        notificationType: 'reactions',
        entityId: new mongoose.Types.ObjectId(postId),
        createdItemId: new mongoose.Types.ObjectId(updatedReaction[1]._id!),
        createdAt: new Date(),
        comment: '',
        post: updatedReaction[2].post,
        imgId: updatedReaction[2].imgId ?? '',
        imgVersion: updatedReaction[2].imgVersion ?? '',
        gifUrl: updatedReaction[2].gifUrl ?? '',
        reaction: type!,
      });

      socketIONotificationObject.emit('insert notification', notifications, {
        userTo,
      });

      const templateParams: NotificationTemplateParams = {
        username: updatedReaction[0].username!,
        message: `${username} reacted to your post`,
        header: 'Post reaction notification',
      };

      const template: string =
        notificationTemplate.getNotificationTemplate(templateParams);
      emailQueue.addEmailJob('reactionsEmail', {
        receiverEmail: updatedReaction[0].email!,
        template,
        subject: 'Post reaction notification',
      });
    }
  }

  public async removeReactionDataFromDB(
    reactionData: ReactionJob
  ): Promise<void> {
    const { postId, previousReaction, username } = reactionData;
    await Promise.all([
      ReactionModel.deleteOne({ postId, type: previousReaction, username }),
      PostModel.updateOne(
        { _id: postId },
        {
          $inc: {
            [`reactions.${previousReaction}`]: -1,
          },
        },
        { new: true }
      ),
    ]);
  }

  public async getPostReactions(
    query: QueryReaction,
    sort: Record<string, 1 | -1>
  ): Promise<[ReactionDocument[], number]> {
    const reactions: ReactionDocument[] = await ReactionModel.aggregate([
      { $match: query },
      { $sort: sort },
    ]);
    return [reactions, reactions.length];
  }

  public async getSinglePostReactionByUsername(
    postId: string,
    username: string
  ): Promise<[ReactionDocument, number] | []> {
    const reactions: ReactionDocument[] = await ReactionModel.aggregate([
      {
        $match: {
          postId: new mongoose.Types.ObjectId(postId),
          username: Helpers.firstLetterUppercase(username),
        },
      },
    ]);
    return reactions.length ? [reactions[0], 1] : [];
  }

  public async getReactionsByUsername(
    username: string
  ): Promise<ReactionDocument[]> {
    const reactions: ReactionDocument[] = await ReactionModel.aggregate([
      {
        $match: {
          username: Helpers.firstLetterUppercase(username),
        },
      },
    ]);
    return reactions;
  }
}

export const reactionService: ReactionService = new ReactionService();
