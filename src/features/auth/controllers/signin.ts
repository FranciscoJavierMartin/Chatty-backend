import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import JWT from 'jsonwebtoken';
import { config } from '@root/config';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { loginSchema } from '@auth/schemes/signin';
import { AuthDocument } from '@auth/interfaces/auth.interface';
import { authService } from '@service/db/auth.service';
import { BadRequestError } from '@global/helpers/error-handler';

export class SignIn {
  @joiValidation(loginSchema)
  public async read(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    const user: AuthDocument = await authService.getAuthUserByUsername(
      username
    );

    if (!user || !(await user.comparePassword(password))) {
      throw new BadRequestError('Invalid credentials');
    }

    const userJwt: string = JWT.sign(
      {
        userId: user._id,
        uId: user.uId,
        email: user.email,
        username: user.username,
        avatarColor: user.avatarColor,
      },
      config.JWT_TOKEN
    );

    req.session = { jwt: userJwt };
    res
      .status(HTTP_STATUS.OK)
      .json({ message: 'User login successfuly', user: user, token: userJwt });
  }
}
