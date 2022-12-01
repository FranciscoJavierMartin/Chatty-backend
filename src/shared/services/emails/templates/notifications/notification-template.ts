import fs from 'fs';
import ejs from 'ejs';
import { NotificationTemplateParams } from '@notification/interfaces/notification.interface';

class NotificationTemplate {
  public getNotificationTemplate(
    templateParams: NotificationTemplateParams
  ): string {
    return ejs.render(
      fs.readFileSync(__dirname + '/notification.ejs', 'utf8'),
      {
        ...templateParams,
        image_url:
          'https://w7.pngwing.com/pngs/120/102/png-transparent-padlock-logo-computer-icons-padlock-technic-logo-password-lock.png',
      }
    );
  }
}

export const notificationTemplate: NotificationTemplate =
  new NotificationTemplate();
