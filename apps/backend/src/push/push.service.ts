// apps/backend/src/push/push.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as webpush from 'web-push';

interface PushPayload {
  title: string;
  body: string;
  link?: string;
  icon?: string | null;
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const email = this.config.get<string>('VAPID_EMAIL');

    if (publicKey && privateKey && email) {
      webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
      this.enabled = true;
    } else {
      this.logger.warn('VAPID keys not set — push notifications disabled. Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL to .env');
    }
  }

  getPublicKey(): string {
    return this.config.get<string>('VAPID_PUBLIC_KEY') ?? '';
  }

  async saveSubscription(endpoint: string, keys: object, userId?: string) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { keys, userId: userId ?? null },
      create: { endpoint, keys, userId: userId ?? null },
    });
  }

  async removeSubscription(endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }

  async sendToAll(payload: PushPayload) {
    if (!this.enabled) return;
    const subs = await this.prisma.pushSubscription.findMany();
    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } },
          JSON.stringify(payload),
        ),
      ),
    );
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length) {
      this.logger.warn(`${failed.length}/${subs.length} push notifications failed`);
    }
  }
}
