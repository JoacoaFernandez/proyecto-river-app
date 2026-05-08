// apps/backend/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Se conecta a tu base de datos de Render al iniciar el servidor
    await this.$connect();
  }

  async onModuleDestroy() {
    // Cierra la conexión de forma segura al apagar el servidor
    await this.$disconnect();
  }
}