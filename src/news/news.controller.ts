import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { NewsService, AnnouncementsService } from './news.service.js';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards/auth.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { successResponse } from '../common/api-response.js';
import type { User } from '@prisma/client';

@Controller('api/v1/news')
export class NewsController {
  constructor(private newsService: NewsService) {}

  @Get()
  async findAll(@Query('stateId') stateId?: string) {
    return successResponse(await this.newsService.findAll(stateId));
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return successResponse(await this.newsService.findBySlug(slug));
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('news.create')
  @Post()
  async create(@Body() body: { title: string; content: string; excerpt?: string; imageUrl?: string; stateId?: string }, @CurrentUser() user: User) {
    return successResponse(await this.newsService.create({ ...body, createdById: user.id }), 'News created');
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('news.publish')
  @Patch(':id/publish')
  async publish(@Param('id') id: string) {
    return successResponse(await this.newsService.publish(id), 'Published');
  }
}

@Controller('api/v1/announcements')
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  @Get()
  async findAll(@Query('stateId') stateId?: string, @Query('lgaId') lgaId?: string, @Query('wardId') wardId?: string) {
    return successResponse(await this.announcementsService.findAll(stateId, lgaId, wardId));
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('announcements.create')
  @Post()
  async create(@Body() body: { title: string; content: string; stateId?: string; lgaId?: string; wardId?: string }, @CurrentUser() user: User) {
    return successResponse(await this.announcementsService.create({ ...body, createdById: user.id }), 'Announcement created');
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('announcements.create')
  @Patch(':id/publish')
  async publish(@Param('id') id: string) {
    return successResponse(await this.announcementsService.publish(id), 'Published');
  }
}
