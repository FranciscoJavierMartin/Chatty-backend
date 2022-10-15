import { GetPostsQuery, PostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { UserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';
import { UpdateQuery } from 'mongoose';

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
}

export const postService: PostService = new PostService();
