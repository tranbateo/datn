import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {
    if (!getApps().length) {
      try {
        initializeApp({
          credential: applicationDefault(),
        });
        this.logger.log('Firebase Admin initialized');
      } catch (error) {
        this.logger.debug(
          'Failed to initialize Firebase Admin. Push notifications will not work without proper credentials.',
          error,
        );
      }
    }
  }

  async sendPushNotification(userId: string, title: string, body: string) {
    // 1. Save to database
    await this.prisma.notification.create({
      data: { userId, title, body },
    });

    // 2. Fetch user's device token
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.deviceToken) {
      this.logger.debug(
        `User ${userId} has no device token. Notification saved to DB only.`,
      );
      return;
    }

    // 3. Send via Firebase
    try {
      await getMessaging().send({
        token: user.deviceToken,
        notification: { title, body },
      });
      this.logger.log(`Push notification sent to ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send push notification to ${userId}`, error);
    }
  }

  // Runs every minute to check for upcoming classes
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const now = new Date();
    // Look for events starting in exactly 30 minutes (window of 1 minute)
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);
    const thirtyOneMinutesFromNow = new Date(now.getTime() + 31 * 60000);

    const upcomingEvents = await this.prisma.calendarEvent.findMany({
      where: {
        startTime: {
          gte: thirtyMinutesFromNow,
          lt: thirtyOneMinutesFromNow,
        },
      },
      include: { user: true },
    });

    if (upcomingEvents.length > 0) {
      this.logger.log(
        `Found ${upcomingEvents.length} upcoming events. Sending notifications...`,
      );
    }

    for (const event of upcomingEvents) {
      const title = `Nhắc nhở: Sắp đến giờ học!`;
      const body = `Sự kiện "${event.title}" sẽ bắt đầu lúc ${event.startTime.toLocaleTimeString()}. Hãy chuẩn bị nhé!`;
      await this.sendPushNotification(event.userId, title, body);
    }
  }
}
