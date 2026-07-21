import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(
    userId: string,
    action: string,
    resource: string,
    details?: any,
  ) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details: details ? (details as Prisma.InputJsonValue) : undefined,
      },
    });
  }
}
