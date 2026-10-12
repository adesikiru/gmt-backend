import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ContentStatus } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(stateId?: string, userId?: string) {
    const events = await this.prisma.event.findMany({
      where: { status: 'PUBLISHED', ...(stateId ? { OR: [{ stateId }, { stateId: null }] } : {}) },
      include: {
        rsvps: { select: { userId: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    return events.map((ev) => {
      const { rsvps, ...rest } = ev;
      return {
        ...rest,
        rsvpCount: rsvps.length,
        userRsvp: userId ? rsvps.some((r) => r.userId === userId) : false,
      };
    });
  }

  async findOne(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        rsvps: { select: { userId: true } },
      },
    });
  }

  async toggleRsvp(eventId: string, userId: string) {
    const existing = await this.prisma.eventRsvp.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
    });

    if (existing) {
      await this.prisma.eventRsvp.delete({
        where: { id: existing.id },
      });
    } else {
      await this.prisma.eventRsvp.create({
        data: { eventId, userId },
      });
    }

    const count = await this.prisma.eventRsvp.count({
      where: { eventId },
    });

    return {
      userRsvp: !existing,
      rsvpCount: count,
    };
  }

  async create(data: { title: string; description: string; location?: string; startDate: Date; endDate?: Date; imageUrl?: string; stateId?: string; createdById: string; status?: ContentStatus }) {
    return this.prisma.event.create({ data });
  }

  async updateStatus(id: string, status: ContentStatus) {
    return this.prisma.event.update({ where: { id }, data: { status } });
  }

  async delete(id: string) {
    return this.prisma.event.delete({ where: { id } });
  }
}
