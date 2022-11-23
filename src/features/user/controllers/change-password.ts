import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import publicIp from 'ip';
import moment from 'moment';
import { resetPasswordTemplate } from '@service/emails/templates/reset-password/reset-password-template';
import { joiValidation } from '@global/decorators/joi-validation.decorator';
import { changePasswordSchema } from '@user/schemes/info';
import { BadRequestError } from '@global/helpers/error-handler';
import { AuthDocument } from '@auth/interfaces/auth.interface';
import { authService } from '@service/db/auth.service';
import { userService } from '@service/db/user.service';
import { ResetPasswordParams } from '@user/interfaces/user.interface';
import { emailQueue } from '@service/queues/email.queue';

export class Update {
  @joiValidation(changePasswordSchema)
  public async password(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      throw new BadRequestError('Passwords do not match');
    }

    const existingUser: AuthDocument = await authService.getAuthUserByUsername(
      req.currentUser!.username
    );

    const passwordMatch: boolean = await existingUser.comparePassword(
      currentPassword
    );

    if (!passwordMatch) {
      throw new BadRequestError('Invalid credentials');
    }

    const hashedPassword: string = await existingUser.hashPassword(newPassword);

    await userService.updatePassword(req.currentUser!.username, hashedPassword);

    const templateParams: ResetPasswordParams = {
      username: existingUser.username,
      email: existingUser.email,
      ipaddress: publicIp.address(),
      date: moment().format('DD/MM/YYYY HH:mm'),
    };

    const template: string =
      resetPasswordTemplate.getPasswordResetTemplate(templateParams);

    emailQueue.addEmailJob('changePasswordEmail', {
      receiverEmail: existingUser.email,
      subject: 'Password Changed Confirmation',
      template,
    });

    res.status(HTTP_STATUS.OK).json({
      message:
        'Password successfully. You will be redirected shortly to the login page',
    });
  }
}
