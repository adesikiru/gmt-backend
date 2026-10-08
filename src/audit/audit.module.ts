import { Module } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { AuditController } from './audit.controller.js';

@Module({ providers: [AuditService], controllers: [AuditController] })
export class AuditModule {}
