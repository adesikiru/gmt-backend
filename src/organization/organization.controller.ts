import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service.js';
import { successResponse } from '../common/api-response.js';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards/auth.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';

@Controller('api/v1')
export class OrganizationController {
  constructor(private orgService: OrganizationService) {}

  @Get('states')
  async getStates() {
    return successResponse(await this.orgService.getStates());
  }

  @Get('states/:id')
  async getState(@Param('id') id: string) {
    return successResponse(await this.orgService.getState(id));
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('states.create')
  @Post('states')
  async createState(@Body() body: { name: string; code: string }) {
    return successResponse(await this.orgService.createState(body), 'State created');
  }

  @Get('lgas')
  async getLGAs(@Query('stateId') stateId?: string) {
    return successResponse(await this.orgService.getLGAs(stateId));
  }

  @Get('lgas/:id')
  async getLGA(@Param('id') id: string) {
    return successResponse(await this.orgService.getLGA(id));
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lgas.create')
  @Post('lgas')
  async createLGA(@Body() body: { name: string; stateId: string }) {
    return successResponse(await this.orgService.createLGA(body), 'LGA created');
  }

  @Get('wards')
  async getWards(@Query('lgaId') lgaId?: string) {
    return successResponse(await this.orgService.getWards(lgaId));
  }

  @Get('wards/:id')
  async getWard(@Param('id') id: string) {
    return successResponse(await this.orgService.getWard(id));
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('wards.create')
  @Post('wards')
  async createWard(@Body() body: { name: string; lgaId: string }) {
    return successResponse(await this.orgService.createWard(body), 'Ward created');
  }

  @Get('polling-units')
  async getPollingUnits(@Query('wardId') wardId?: string) {
    return successResponse(await this.orgService.getPollingUnits(wardId));
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('wards.create')
  @Post('polling-units')
  async createPollingUnit(@Body() body: { name: string; code?: string; wardId: string }) {
    return successResponse(await this.orgService.createPollingUnit(body), 'Polling unit created');
  }
}
