import { Request, Response } from 'express';
import * as cloudinaryUploads from '@global/helpers/cloudinary-upload';
import {
  authMockRequest,
  authMockResponse,
} from '@root/features/mocks/auth.mock';
import { SignUp } from '@auth/controllers/signup';
import { BadRequestError, CustomError } from '@global/helpers/error-handler';

jest.mock('@service/queues/base.queue');
jest.mock('@service/redis/user.cache');
jest.mock('@service/queues/user.queue');
jest.mock('@service/queues/auth.queue');
jest.mock('@global/helpers/cloudinary-upload');

describe('SignUp', () => {
  it('should throw an error if username is not available', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: '',
        email: 'test@test.com',
        password: 'test',
        avatarColor: 'blue',
        avatarImage: 'data:text/plain;base64,SVGsbG8sIFdvcmxkIQ==',
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toBe(400);
      expect(error.serializeErros().message).toBe(
        'Username is a required field'
      );
    });
  });
});
