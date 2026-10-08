import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ContentStatus } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(stateId?: string) {
    return this.prisma.event.findMany({
      where: { status: 'PUBLISHED', ...(stateId ? { OR: [{ stateId }, { stateId: null }] } : {}) },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.event.findUnique({ where: { id } });
  }

  async create(data: { title: string; description: string; location?: string; startDate: Date; endDate?: Date; imageUrl?: string; stateId?: string; createdById: string }) {
    return this.prisma.event.create({ data });
  }

  async updateStatus(id: string, status: ContentStatus) {
    return this.prisma.event.update({ where: { id }, data: { status } });
  }
}
