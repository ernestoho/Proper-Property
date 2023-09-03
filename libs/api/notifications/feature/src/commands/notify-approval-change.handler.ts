import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { NotifyApprovalChangeCommand } from '@properproperty/api/notifications/util';
import { Notification } from '@properproperty/api/notifications/util';
import { Timestamp } from '@firebase/firestore';
import { NotificationsDocModel } from '../models/notifications.model';
import { NotificationsDoc } from '@properproperty/api/notifications/util';
import { NotificationsRepository } from '@properproperty/api/notifications/data-access';
import { MailerService } from '@nestjs-modules/mailer';
import  * as nodemailer  from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { ProfileRepository } from '@properproperty/api/profile/data-access';
@CommandHandler(NotifyApprovalChangeCommand)
export class NotifyApprovalChangeHandler implements ICommandHandler<NotifyApprovalChangeCommand> {
  constructor(
    private readonly notifRepo: NotificationsRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly mailer: MailerService,
    private readonly profileRepo: ProfileRepository 
  ){}
  async execute(command: NotifyApprovalChangeCommand) {
    console.log('---NotifyApprovalChangeCommand: ' + command.status);
    const profile = (await this.profileRepo.getUserProfile(command.userId)).user;
    if (!profile) {
      console.log('---User profile not found');
      return;
    }
    if (!profile.email) {
      console.log('---User profile email not found');
      return;
    }
    const cred_path = path.join(__dirname, '..', '..', '..', 'victorias-secret-google-credentials', 'spambot-9000-inator.json');
    console.log(cred_path);
    
    const creds = JSON.parse(fs.readFileSync(cred_path, 'utf8'));
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: creds.auth.user,
        pass: creds.auth.pass
      }
    });
    
    const notification: Notification = {
      userId: command.userId,
      listingId: command.listingId,
      head: command.status ? "Your listing has been approved" : "Your listing has been edited",
      body: command.status 
        ? "Your listing is now visible to other users and you will be able to review its engagement."
        : "Your listing has been edited and is awaiting reapproval.",
      type: "ApprovalChange",
      senderId: "system",
      date: Timestamp.fromDate(new Date())
    };

    const mailoptions = {
      from: creds.user,
      to: profile.email,
      subject: notification.head,
      text: notification.body
    };
    
    transporter.sendMail(mailoptions, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    // const notificationsDoc: NotificationsDoc = await this.notifRepo.getNotifications(command.userId);
    // const notifModel: NotificationsDocModel = this
    //   .eventPublisher
    //   .mergeObjectContext(
    //     NotificationsDocModel
    //     .createNotifications(notificationsDoc)
    //   );

    // notifModel.sendApprovalChangeNotification(notification);
    // notifModel.commit();
  }
}
