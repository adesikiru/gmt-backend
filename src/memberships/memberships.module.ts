import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service.js';
import { MembershipsController } from './memberships.controller.js';

@Module({
  providers: [MembershipsService],
  controllers: [MembershipsController],
})
export class MembershipsModule {}
