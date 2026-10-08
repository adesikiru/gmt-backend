import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { OrganizationModule } from './organization/organization.module.js';
import { MembershipsModule } from './memberships/memberships.module.js';
import { EventsModule } from './events/events.module.js';
import { NewsModule } from './news/news.module.js';
import { AuditModule } from './audit/audit.module.js';
import { HealthModule } from './health/health.module.js';
import { PermissionsGuard } from './common/guards/auth.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    OrganizationModule,
    MembershipsModule,
    EventsModule,
    NewsModule,
    AuditModule,
    HealthModule,
  ],
  providers: [PermissionsGuard],
})
export class AppModule {}
