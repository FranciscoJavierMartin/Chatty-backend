import {
  CommentDocument,
  CommentJob,
  CommentNameList,
  QueryComment,
} from '@comment/interfaces/comment.interface';
import { CommentsModel } from '@comment/models/comment.schema';
import {
  NotificationDocument,
  NotificationTemplateParams,
} from '@notification/interfaces/notification.interface';
import { NotificationModel } from '@notification/models/notification.schema';
import { PostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { notificationTemplate } from '@service/emails/templates/notifications/notification-template';
import { emailQueue } from '@service/queues/email.queue';
import { UserCache } from '@service/redis/user.cache';
import { socketIONotificationObject } from '@socket/notification';
import { UserDocument } from '@user/interfaces/user.interface';
import mongoose, { Query } from 'mongoose';

const userCache: UserCache = new UserCache();

class CommentService {
  public async addCommentToDB(commentData: CommentJob): Promise<void> {
    const { postId, userTo, userFrom, comment, username } = commentData;
    const comments: Promise<CommentDocument> = CommentsModel.create(comment);
    const post: Query<PostDocument, PostDocument> = PostModel.findOneAndUpdate(
      { _id: postId },
      {
        $inc: {
          commentsCount: 1,
        },
      },
      { new: true }
    ) as Query<PostDocument, PostDocument>;
    const user: Promise<UserDocument> = userCache.getUserFromCache(
      userTo
    ) as Promise<UserDocument>;
    const response: [CommentDocument, PostDocument, UserDocument] =
      await Promise.all([comments, post, user]);

    if (response[2].notifications.comments && userFrom !== userTo) {
      const notificationModel: NotificationDocument = new NotificationModel();

      const notifications = await notificationModel.insertNotification({
        userFrom,
        userTo,
        message: `${username} commented on your post`,
        notificationType: 'comment',
        entityId: new mongoose.Types.ObjectId(postId),
        createdItemId: new mongoose.Types.ObjectId(response[0]._id!),
        createdAt: new Date(),
        comment: comment.comment,
        post: response[1].post,
        imgId: response[1].imgId!,
        imgVersion: response[1].imgVersion!,
        gifUrl: response[1].gifUrl!,
        reaction: '',
      });

      socketIONotificationObject.emit('insert notification', notifications, {
        userTo,
      });

      const templateParams: NotificationTemplateParams = {
        username: response[2].username!,
        message: `${username} commented on your post`,
        header: 'Comment notification',
      };

      const template: string =
        notificationTemplate.getNotificationTemplate(templateParams);
      emailQueue.addEmailJob('commentsEmail', {
        receiverEmail: response[2].email!,
        template,
        subject: 'Post notification',
      });
    }
  }

  public async getPostComments(
    query: QueryComment,
    sort: Record<string, 1 | -1>
  ): Promise<CommentDocument[]> {
    const comments: CommentDocument[] = await CommentsModel.aggregate([
      { $match: query },
      { $sort: sort },
    ]);

    return comments;
  }

  public async getPostCommentNames(
    query: QueryComment,
    sort: Record<string, 1 | -1>
  ): Promise<CommentNameList[]> {
    return await CommentsModel.aggregate([
      { $match: query },
      { $sort: sort },
      {
        $group: {
          _id: null,
          names: { $addToSet: '$username' },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0 } },
    ]);
  }
}

export const commentService: CommentService = new CommentService();
