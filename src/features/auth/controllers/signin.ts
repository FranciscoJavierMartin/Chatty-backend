import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import JWT from 'jsonwebtoken';
import { config } from '@root/config';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { loginSchema } from '@auth/schemes/signin';
import { AuthDocument } from '@auth/interfaces/auth.interface';
import { authService } from '@service/db/auth.service';
import { BadRequestError } from '@global/helpers/error-handler';
import {
  ResetPasswordParams,
  UserDocument,
} from '@user/interfaces/user.interface';
import { userService } from '@service/db/user.service';
import { forgotPasswordTemplate } from '@service/emails/templates/forgot-password/forgot-password-template';
import { emailQueue } from '@service/queues/email.queue';
import moment from 'moment';
import publicIP from 'ip';
import { resetPasswordTemplate } from '@service/emails/templates/reset-password/reset-password-template';

export class SignIn {
  @joiValidation(loginSchema)
  public async read(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    const authUser: AuthDocument = await authService.getAuthUserByUsername(
      username
    );

    if (!authUser || !(await authUser.comparePassword(password))) {
      throw new BadRequestError('Invalid credentials');
    }

    const user: UserDocument = await userService.getUserByAuthId(
      authUser._id.toString()
    );

    const userJwt: string = JWT.sign(
      {
        userId: user._id,
        uId: authUser.uId,
        email: authUser.email,
        username: authUser.username,
        avatarColor: authUser.avatarColor,
      },
      config.JWT_TOKEN
    );

    req.session = { jwt: userJwt };

    const userDocument: UserDocument = {
      ...user,
      authId: authUser._id,
      username: authUser.username,
      email: authUser.email,
      avatarColor: authUser.avatarColor,
      uId: authUser.uId,
      createdAt: authUser.createdAt,
    } as UserDocument;

    res.status(HTTP_STATUS.OK).json({
      message: 'User login successfuly',
      user: userDocument,
      token: userJwt,
    });
  }
}
