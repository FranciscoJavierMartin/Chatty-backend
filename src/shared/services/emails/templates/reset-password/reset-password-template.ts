import fs from 'fs';
import ejs from 'ejs';
import { ResetPasswordParams } from '@user/interfaces/user.interface';

class ResetPasswordTemplate {
  public getPasswordResetTemplate({
    username,
    email,
    ipaddress,
    date,
  }: ResetPasswordParams): string {
    return ejs.render(
      fs.readFileSync(__dirname + '/reset-password-template.ejs', 'utf8'),
      {
        username,
        email,
        ipaddress,
        date,
        image_url:
          'https://w7.pngwing.com/pngs/120/102/png-transparent-padlock-logo-computer-icons-padlock-technic-logo-password-lock.png',
      }
    );
  }
}

export const resetPasswordTemplate: ResetPasswordTemplate =
  new ResetPasswordTemplate();
