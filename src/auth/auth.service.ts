import { Injectable, BadRequestException, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto, LoginDto, UpdateProfileDto, UpdatePasswordDto } from './auth.dto.js';
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
      },
      include: {
        memberProfile: true,
      },
    });

    await this.prisma.membership.create({
      data: {
        userId: user.id,
        profileId: user.memberProfile?.id,
        status: 'PENDING',
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

    // Check if user is an admin
    const adminRecord = await this.prisma.admin.findUnique({
      where: { userId: user.id },
      include: { role: true },
    });
    const isAdmin = !!adminRecord;
    const roleName = adminRecord?.role?.name ?? null;

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      phone: user.phone,
      isAdmin,
      role: roleName,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        firstName: user.memberProfile?.firstName,
        lastName: user.memberProfile?.lastName,
        isAdmin,
        role: roleName,
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

    const adminRecord = await this.prisma.admin.findUnique({
      where: { userId },
      include: { role: true },
    });

    const { passwordHash, emailVerifyToken, passwordResetToken, ...safe } = user;
    return {
      ...safe,
      isAdmin: !!adminRecord,
      role: adminRecord?.role?.name ?? null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: dto.phone, id: { not: userId } },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number is already associated with another account');
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone: dto.phone },
      });
    }

    const currentProfile = await this.prisma.memberProfile.findUnique({
      where: { userId },
    });

    const profileData: Record<string, unknown> = {};
    if (dto.firstName !== undefined) profileData.firstName = dto.firstName;
    if (dto.lastName !== undefined) profileData.lastName = dto.lastName;
    if (dto.middleName !== undefined) profileData.middleName = dto.middleName;
    if (dto.nin !== undefined) profileData.nin = dto.nin;
    if (dto.isRegisteredVoter !== undefined) {
      profileData.isRegisteredVoter = dto.isRegisteredVoter;
      if (dto.isRegisteredVoter) {
        if (dto.voterCardNumber !== undefined) profileData.voterCardNumber = dto.voterCardNumber;
        if (dto.stateId !== undefined) profileData.stateId = dto.stateId || null;
        if (dto.lgaId !== undefined) profileData.lgaId = dto.lgaId || null;
        if (dto.wardId !== undefined) profileData.wardId = dto.wardId || null;
        if (dto.pollingUnitId !== undefined) profileData.pollingUnitId = dto.pollingUnitId || null;
      }
    } else {
      if (dto.voterCardNumber !== undefined) profileData.voterCardNumber = dto.voterCardNumber;
      if (dto.stateId !== undefined) profileData.stateId = dto.stateId || null;
      if (dto.lgaId !== undefined) profileData.lgaId = dto.lgaId || null;
      if (dto.wardId !== undefined) profileData.wardId = dto.wardId || null;
      if (dto.pollingUnitId !== undefined) profileData.pollingUnitId = dto.pollingUnitId || null;
    }

    if (currentProfile) {
      await this.prisma.memberProfile.update({
        where: { userId },
        data: profileData,
      });
    } else {
      const newProfile = await this.prisma.memberProfile.create({
        data: {
          userId,
          firstName: dto.firstName || 'Member',
          lastName: dto.lastName || '',
          ...profileData,
        },
      });

      // Link to existing membership if needed
      await this.prisma.membership.updateMany({
        where: { userId, profileId: null },
        data: { profileId: newProfile.id },
      });
    }

    return this.getProfile(userId);
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password does not match');

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Password updated successfully' };
  }
}
