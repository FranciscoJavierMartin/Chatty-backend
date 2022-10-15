import {
  GetPostsQuery,
  PostDocument,
  QueryComplete,
  QueryDeleted,
} from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { UserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';
import { Query, UpdateQuery } from 'mongoose';

class PostService {
  public async addPostToDB(
    userId: string,
    createdPost: PostDocument
  ): Promise<void> {
    const post: Promise<PostDocument> = PostModel.create(createdPost);
    const user: UpdateQuery<UserDocument> = UserModel.updateOne(
      {
        _id: userId,
      },
      {
        $inc: { postsCount: 1 },
      }
    );

    await Promise.all([post, user]);
  }

  public async getPosts(
    query: GetPostsQuery,
    skip = 0,
    limit = 0,
    sort: Record<string, 1 | -1>
  ): Promise<PostDocument[]> {
    let postQuery = {};

    if (query.imgId && query.gifUrl) {
      postQuery = { $or: [{ imgId: { $ne: '' } }, { gifUrl: { $ne: '' } }] };
    } else {
      postQuery = query;
    }

    const posts: PostDocument[] = await PostModel.aggregate([
      { $match: postQuery },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ]);

    return posts;
  }

  public async postsCount(): Promise<number> {
    return await PostModel.find({}).countDocuments();
  }

  public async deletePost(postId: string, userId: string): Promise<void> {
    const deletePost: Query<QueryComplete & QueryDeleted, PostDocument> =
      PostModel.deleteOne({ _id: postId });
    const decrementPostCount: UpdateQuery<UserDocument> = UserModel.updateOne(
      { _id: userId },
      { $inc: { postsCount: -1 } }
    );

    await Promise.all([deletePost, decrementPostCount]);
  }
}

export const postService: PostService = new PostService();
