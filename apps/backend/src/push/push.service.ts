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
    return this.sendToSegment(payload, 'all');
  }

  async countSegment(segment: PushSegment): Promise<number> {
    const userIds = await this.resolveSegmentUserIds(segment);
    if (userIds === null) return this.prisma.pushSubscription.count();
    if (userIds.size === 0) return 0;
    return this.prisma.pushSubscription.count({ where: { userId: { in: [...userIds] } } });
  }

  async sendToSegment(payload: PushPayload, segment: PushSegment): Promise<{ sent: number; failed: number; total: number }> {
    if (!this.enabled) return { sent: 0, failed: 0, total: 0 };

    const userIds = await this.resolveSegmentUserIds(segment);
    const subs = userIds === null
      ? await this.prisma.pushSubscription.findMany()
      : userIds.size === 0
        ? []
        : await this.prisma.pushSubscription.findMany({ where: { userId: { in: [...userIds] } } });

    if (subs.length === 0) return { sent: 0, failed: 0, total: 0 };

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } },
          JSON.stringify(payload),
        ),
      ),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) this.logger.warn(`${failed}/${subs.length} push notifications failed (segment=${segment})`);
    return { sent: subs.length - failed, failed, total: subs.length };
  }

  /**
   * Devuelve los userIds que corresponden al segmento, o null si el segmento es 'all'
   * (todos los subs, incluyendo anónimos sin userId).
   */
  private async resolveSegmentUserIds(segment: PushSegment): Promise<Set<string> | null> {
    if (segment === 'all') return null;

    if (segment === 'authenticated') {
      const subs = await this.prisma.pushSubscription.findMany({
        where: { userId: { not: null } },
        select: { userId: true },
      });
      return new Set(subs.map((s) => s.userId!).filter(Boolean));
    }

    if (segment === 'notifGoals' || segment === 'notifMatch' || segment === 'notifNews') {
      const users = await this.prisma.user.findMany({
        where: { [segment]: true, isBanned: false } as any,
        select: { id: true },
      });
      return new Set(users.map((u) => u.id));
    }

    if (segment === 'active7d') {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [comments, votes, predictions, likes] = await Promise.all([
        this.prisma.comment.findMany({ where: { createdAt: { gte: since } }, select: { userId: true } }),
        this.prisma.surveyVote.findMany({ where: { createdAt: { gte: since } }, select: { userId: true } }),
        this.prisma.prediction.findMany({ where: { createdAt: { gte: since } }, select: { userId: true } }),
        this.prisma.newsLike.findMany({ select: { userId: true } }),
      ]);
      const ids = new Set<string>([
        ...comments.map((c) => c.userId),
        ...votes.map((v) => v.userId),
        ...predictions.map((p) => p.userId),
        ...likes.map((l) => l.userId),
      ]);
      return ids;
    }

    return new Set();
  }
}

export type PushSegment = 'all' | 'authenticated' | 'active7d' | 'notifGoals' | 'notifMatch' | 'notifNews';
