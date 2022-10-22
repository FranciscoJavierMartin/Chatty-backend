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

    const updatedReaction = await Promise.all([
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
    ]);
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
