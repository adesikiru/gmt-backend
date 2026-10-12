import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ContentStatus } from '@prisma/client';

@Injectable()
export class EmpowermentService {
  constructor(private prisma: PrismaService) {}

  async findAll(stateId?: string) {
    return this.prisma.empowerment.findMany({
      where: {
        status: 'PUBLISHED',
        ...(stateId ? { OR: [{ stateId }, { stateId: null }] } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.empowerment.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Empowerment initiative not found');
    return item;
  }

  async create(data: {
    title: string;
    description: string;
    category: string;
    statOrBudget?: string;
    targetAudience?: string;
    icon?: string;
    status?: ContentStatus;
    stateId?: string;
    createdById: string;
  }) {
    return this.prisma.empowerment.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        statOrBudget: data.statOrBudget,
        targetAudience: data.targetAudience,
        icon: data.icon || '🤝',
        status: data.status || 'PUBLISHED',
        stateId: data.stateId,
        createdById: data.createdById,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.empowerment.delete({ where: { id } });
  }
}
