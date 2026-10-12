import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EmpowermentService } from './empowerment.service.js';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards/auth.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { successResponse } from '../common/api-response.js';
import { ContentStatus } from '@prisma/client';
import type { User } from '@prisma/client';

@Controller('api/v1/empowerments')
export class EmpowermentController {
  constructor(private service: EmpowermentService) {}

  @Get()
  async findAll(@Query('stateId') stateId?: string) {
    return successResponse(await this.service.findAll(stateId));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return successResponse(await this.service.findOne(id));
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('announcements.create')
  @Post()
  async create(
    @Body()
    body: {
      title: string;
      description: string;
      category: string;
      statOrBudget?: string;
      targetAudience?: string;
      icon?: string;
      status?: ContentStatus;
      stateId?: string;
    },
    @CurrentUser() user: User,
  ) {
    return successResponse(
      await this.service.create({
        ...body,
        createdById: user.id,
      }),
      'Empowerment initiative created',
    );
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('announcements.create')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return successResponse(await this.service.delete(id), 'Empowerment initiative deleted');
  }
}
