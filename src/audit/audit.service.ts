import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async getLogs(filters: { page?: number; limit?: number; action?: string } = {}) {
    const { page = 1, limit = 50, action } = filters;
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { ...(action && { action }) },
        include: { actor: { select: { id: true, email: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { ...(action && { action }) } }),
    ]);
    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
