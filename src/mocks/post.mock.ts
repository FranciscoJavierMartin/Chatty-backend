import { AuthPayload } from '@auth/interfaces/auth.interface';
import { Response } from 'express';
import mongoose from 'mongoose';
import { existingUser } from '@root/mocks/user.mock';
import { PostDocument } from '@post/interfaces/post.interface';

export const postMockRequest = (
  body: Body,
  currentUser?: AuthPayload | null,
  params?: Params
) => ({
  body,
  params,
  currentUser,
});

export const postMockResponse = (): Response => {
  const res: Response = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

interface Params {
  postId?: string;
  page?: string;
}

interface Body {
  bgColor: string;
  post?: string;
  gifUrl?: string;
  image?: string;
  privacy?: string;
  imgId?: string;
  imgVersion?: string;
  profilePicture?: string;
  feelings?: string;
}

export const newPost: Body = {
  bgColor: '#f44336',
  post: 'how are you?',
  gifUrl: '',
  imgId: '',
  imgVersion: '',
  image: '',
  privacy: 'Public',
  profilePicture: 'http://place-hold.it/500x500',
  feelings: 'happy',
};

export const postMockData: PostDocument = {
  _id: new mongoose.Types.ObjectId('6027f77087c9d9ccb1555268'),
  userId: existingUser._id,
  username: existingUser.username,
  email: existingUser.email,
  avatarColor: existingUser.avatarColor,
  profilePicture: existingUser.profilePicture,
  post: 'how are you?',
  bgColor: '#f44336',
  imgId: '',
  imgVersion: '',
  feelings: 'happy',
  gifUrl: '',
  privacy: 'Public',
  commentsCount: 0,
  createdAt: new Date(),
  reactions: {
    like: 0,
    love: 0,
    happy: 0,
    wow: 0,
    sad: 0,
    angry: 0,
  },
} as unknown as PostDocument;

export const updatedPost = {
  profilePicture: postMockData.profilePicture,
  post: postMockData.post,
  bgColor: postMockData.bgColor,
  feelings: 'wow',
  privacy: 'Private',
  gifUrl: '',
  imgId: '',
  imgVersion: '',
};

export const updatedPostWithImage = {
  profilePicture: postMockData.profilePicture,
  post: 'Wonderful',
  bgColor: postMockData.bgColor,
  feelings: 'wow',
  privacy: 'Private',
  gifUrl: '',
  imgId: '',
  imgVersion: '',
  image: '',
};
