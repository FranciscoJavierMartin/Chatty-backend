import { Request, Response } from 'express';
import crypto from 'crypto';
import HTTP_STATUS from 'http-status-codes';
import { AuthDocument } from '@auth/interfaces/auth.interface';
import { emailSchema } from '@auth/schemes/password';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { BadRequestError } from '@global/helpers/error-handler';
import { authService } from '@service/db/auth.service';
import { config } from '@root/config';
import { forgotPasswordTemplate } from '@service/emails/templates/forgot-password/forgot-password-template';
import { emailQueue } from '@service/queues/email.queue';

export class Password {
  @joiValidation(emailSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    const authUser: AuthDocument = await authService.getAuthUserByEmail(email);

    if (!authUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');

    await authService.updatePasswordToken(
      authUser._id.toString(),
      randomCharacters,
      Date.now() * 60 * 60 * 1000
    );

    const resetLink = `${config.CLIENT_URL}/reset-password?token=${randomCharacters}`;
    const template: string = forgotPasswordTemplate.getPasswordForgotTemplate(
      authUser.username,
      resetLink
    );

    emailQueue.addEmailJob('forgotPasswordEmail', {
      receiverEmail: email,
      template,
      subject: 'Reset your password',
    });

    res.status(HTTP_STATUS.OK).json({
      message: 'Password reset email sent',
    });
  }
}
