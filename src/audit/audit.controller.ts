import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards/auth.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { successResponse } from '../common/api-response.js';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('auditLogs.read')
@Controller('api/v1/admin/audit-logs')
export class AuditController {
  constructor(private service: AuditService) {}

  @Get()
  async getLogs(@Query('page') page?: string, @Query('limit') limit?: string, @Query('action') action?: string) {
    return successResponse(await this.service.getLogs({ page: Number(page), limit: Number(limit), action }));
  }
}
