import {
  CommentDocument,
  CommentJob,
  QueryComment,
} from '@comment/interfaces/comment.interface';
import { CommentsModel } from '@comment/models/comment.schema';
import { PostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { UserCache } from '@service/redis/user.cache';
import { UserDocument } from '@user/interfaces/user.interface';
import { Query } from 'mongoose';

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

    //TODO: Send comments notifications
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
}

export const commentService: CommentService = new CommentService();
