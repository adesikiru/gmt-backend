import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards/auth.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { successResponse } from '../common/api-response.js';
import type { User } from '@prisma/client';

@Controller('api/v1/events')
export class EventsController {
  constructor(private service: EventsService) {}

  @Get()
  async findAll(@Query('stateId') stateId?: string) {
    return successResponse(await this.service.findAll(stateId));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return successResponse(await this.service.findOne(id));
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('events.create')
  @Post()
  async create(
    @Body() body: { title: string; description: string; location?: string; startDate: string; endDate?: string; imageUrl?: string; stateId?: string },
    @CurrentUser() user: User,
  ) {
    return successResponse(await this.service.create({ ...body, startDate: new Date(body.startDate), endDate: body.endDate ? new Date(body.endDate) : undefined, createdById: user.id }), 'Event created');
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('events.update')
  @Patch(':id/publish')
  async publish(@Param('id') id: string) {
    return successResponse(await this.service.updateStatus(id, 'PUBLISHED'), 'Event published');
  }
}
