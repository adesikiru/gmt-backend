import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MembershipStatus } from '@prisma/client';

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}

  async getMembers(filters: { status?: MembershipStatus; stateId?: string; lgaId?: string; wardId?: string; page?: number; limit?: number }) {
    const { status, stateId, lgaId, wardId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (stateId || lgaId || wardId) {
      where.profile = {
        ...(stateId && { stateId }),
        ...(lgaId && { lgaId }),
        ...(wardId && { wardId }),
      };
    }

    const [memberships, total] = await Promise.all([
      this.prisma.membership.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, phone: true, createdAt: true } },
          profile: {
            include: { state: true, lga: true, ward: true, pollingUnit: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.membership.count({ where }),
    ]);

    return { memberships, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getMembership(id: string) {
    const m = await this.prisma.membership.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, phone: true, createdAt: true } },
        profile: { include: { state: true, lga: true, ward: true, pollingUnit: true } },
      },
    });
    if (!m) throw new NotFoundException('Membership not found');
    return m;
  }

  async updateStatus(id: string, status: MembershipStatus, reviewedBy: string, reason?: string) {
    const m = await this.prisma.membership.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Membership not found');

    const updated = await this.prisma.membership.update({
      where: { id },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        rejectionReason: reason,
        ...(status === 'VERIFIED' && !m.membershipNumber
          ? { membershipNumber: this.generateMembershipNumber() }
          : {}),
      },
    });

    // Audit
    await this.prisma.auditLog.create({
      data: {
        actorId: reviewedBy,
        action: `MEMBERSHIP_${status}`,
        targetType: 'Membership',
        targetId: id,
        metadata: { reason },
      },
    });

    return updated;
  }

  private generateMembershipNumber(): string {
    const prefix = 'GMT';
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${year}-${random}`;
  }

  async getMyMembership(userId: string) {
    return this.prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        profile: { include: { state: true, lga: true, ward: true } },
      },
    });
  }
}
