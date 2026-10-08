import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service.js';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards/auth.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { successResponse } from '../common/api-response.js';
import { MembershipStatus } from '@prisma/client';
import type { User } from '@prisma/client';

@Controller('api/v1')
export class MembershipsController {
  constructor(private service: MembershipsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my-membership')
  async myMembership(@CurrentUser() user: User) {
    return successResponse(await this.service.getMyMembership(user.id));
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('members.read')
  @Get('admin/members')
  async getMembers(
    @Query('status') status?: MembershipStatus,
    @Query('stateId') stateId?: string,
    @Query('lgaId') lgaId?: string,
    @Query('wardId') wardId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.service.getMembers({ status, stateId, lgaId, wardId, page: Number(page), limit: Number(limit) });
    return successResponse(data);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('members.read')
  @Get('admin/members/:id')
  async getMember(@Param('id') id: string) {
    return successResponse(await this.service.getMembership(id));
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('members.verify')
  @Patch('admin/members/:id/verify')
  async verify(@Param('id') id: string, @CurrentUser() user: User) {
    return successResponse(await this.service.updateStatus(id, 'VERIFIED', user.id), 'Member verified');
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('members.reject')
  @Patch('admin/members/:id/reject')
  async reject(@Param('id') id: string, @Body() body: { reason?: string }, @CurrentUser() user: User) {
    return successResponse(await this.service.updateStatus(id, 'REJECTED', user.id, body.reason), 'Member rejected');
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('members.suspend')
  @Patch('admin/members/:id/suspend')
  async suspend(@Param('id') id: string, @Body() body: { reason?: string }, @CurrentUser() user: User) {
    return successResponse(await this.service.updateStatus(id, 'SUSPENDED', user.id, body.reason), 'Member suspended');
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('members.verify')
  @Patch('admin/members/:id/restore')
  async restore(@Param('id') id: string, @CurrentUser() user: User) {
    return successResponse(await this.service.updateStatus(id, 'VERIFIED', user.id), 'Member restored');
  }
}
