// apps/backend/src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Hace que el servicio sea accesible en todos los módulos de la app
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}