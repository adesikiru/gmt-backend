import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async findAll(stateId?: string) {
    return this.prisma.news.findMany({
      where: { status: 'PUBLISHED', ...(stateId ? { OR: [{ stateId }, { stateId: null }] } : {}) },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.news.findUnique({ where: { slug } });
  }

  async create(data: { title: string; content: string; excerpt?: string; imageUrl?: string; stateId?: string; createdById: string }) {
    const slug = data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    return this.prisma.news.create({ data: { ...data, slug } });
  }

  async publish(id: string) {
    return this.prisma.news.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
  }
}

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async findAll(stateId?: string, lgaId?: string, wardId?: string) {
    return this.prisma.announcement.findMany({
      where: {
        status: 'PUBLISHED',
        ...(stateId && { OR: [{ stateId }, { stateId: null }] }),
        ...(lgaId && { OR: [{ lgaId }, { lgaId: null }] }),
        ...(wardId && { OR: [{ wardId }, { wardId: null }] }),
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async create(data: { title: string; content: string; stateId?: string; lgaId?: string; wardId?: string; createdById: string }) {
    return this.prisma.announcement.create({ data });
  }

  async publish(id: string) {
    return this.prisma.announcement.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
  }
}
