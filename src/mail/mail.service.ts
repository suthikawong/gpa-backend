import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail({
    sendTo,
    subject,
    html,
  }: {
    sendTo: string[];
    subject: string;
    html: string;
  }) {
    try {
      if (sendTo.length === 0) {
        throw new Error(
          `No recipients found in SMTP_TO env var, please check your .env file`,
        );
      }
      const sendMailParams = {
        to: sendTo,
        from: process.env.SMTP_FROM_USER,
        subject,
        html,
      };
      await this.mailerService.sendMail(sendMailParams);
    } catch (error) {
      console.error('error:', error);
    }
  }
}
