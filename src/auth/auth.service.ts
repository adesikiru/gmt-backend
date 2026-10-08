import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto, LoginDto } from './auth.dto.js';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone is required');
    }

    // Check duplicates
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Email already registered');
    }
    if (dto.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (existing) throw new ConflictException('Phone already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const verifyToken = randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        emailVerifyToken: dto.email ? verifyToken : null,
        memberProfile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            middleName: dto.middleName,
            stateId: dto.stateId,
            lgaId: dto.lgaId,
            wardId: dto.wardId,
            pollingUnitId: dto.pollingUnitId,
            isRegisteredVoter: dto.isRegisteredVoter ?? false,
            voterCardNumber: dto.voterCardNumber,
            nin: dto.nin,
          },
        },
        memberships: {
          create: {
            status: 'PENDING',
          },
        },
      },
      include: {
        memberProfile: true,
      },
    });

    // TODO: send verification email/SMS in production
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      verifyToken, // remove in production — send via email
    };
  }

  async login(dto: LoginDto) {
    // Find by email or phone
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.identifier },
          { phone: dto.identifier },
        ],
      },
      include: { memberProfile: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.accountStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Account is suspended or inactive');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = this.jwt.sign({ sub: user.id, email: user.email, phone: user.phone });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        firstName: user.memberProfile?.firstName,
        lastName: user.memberProfile?.lastName,
      },
    };
  }

  async verifyAccount(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) throw new BadRequestException('Invalid or expired verification token');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null },
    });

    return { message: 'Account verified successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberProfile: {
          include: {
            state: true,
            lga: true,
            ward: true,
            pollingUnit: true,
          },
        },
        memberships: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) throw new UnauthorizedException();

    const { passwordHash, emailVerifyToken, passwordResetToken, ...safe } = user;
    return safe;
  }
}
