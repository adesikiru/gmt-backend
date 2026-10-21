import { Injectable, BadRequestException, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto, LoginDto, UpdateProfileDto, UpdatePasswordDto } from './auth.dto.js';
import { normalizePhoneNumber, normalizeEmail } from '../common/utils/phone.util.js';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = normalizeEmail(dto.email);
    let phone: string | null = null;

    if (dto.phone) {
      const phoneValidation = normalizePhoneNumber(dto.phone);
      if (!phoneValidation.isValid || !phoneValidation.normalized) {
        throw new BadRequestException(
          phoneValidation.error ||
            'Invalid phone number. Must be a valid 11-digit Nigerian phone number (e.g. 08012345678 or +2348012345678)',
        );
      }
      phone = phoneValidation.normalized;
    }

    if (!email && !phone) {
      throw new BadRequestException('Email or phone number is required');
    }

    // Check duplicate email
    if (email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });
      if (existingEmail) {
        throw new ConflictException(
          'This email address is already registered to an account. Another user cannot use the same email.',
        );
      }
    }

    // Check duplicate phone (matches canonical 0... or international +234...)
    if (phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          OR: [
            { phone: phone },
            { phone: `+234${phone.slice(1)}` },
            { phone: phone.slice(1) },
          ],
        },
      });
      if (existingPhone) {
        throw new ConflictException(
          'This phone number is already registered to an account. Another user cannot use the same phone number.',
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const verifyToken = randomBytes(32).toString('hex');

    // Resolve organizational / voter location to ensure valid database records
    const location = await this.resolveLocation(dto);

    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        emailVerifyToken: email ? verifyToken : null,
        memberProfile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            middleName: dto.middleName,
            phone,
            stateId: location.stateId,
            lgaId: location.lgaId,
            wardId: location.wardId,
            pollingUnitId: location.pollingUnitId,
            isRegisteredVoter: dto.isRegisteredVoter ?? false,
            voterCardNumber: dto.isRegisteredVoter ? dto.voterCardNumber?.trim()?.toUpperCase() : null,
            nin: dto.nin?.trim(),
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
    const rawIdentifier = dto.identifier.trim();
    let queryWhere: Record<string, unknown>;

    if (rawIdentifier.includes('@')) {
      // Identifier is an email
      queryWhere = {
        email: { equals: rawIdentifier.toLowerCase(), mode: 'insensitive' },
      };
    } else {
      // Identifier may be a phone number
      const phoneValidation = normalizePhoneNumber(rawIdentifier);
      if (phoneValidation.isValid && phoneValidation.normalized) {
        const norm = phoneValidation.normalized;
        queryWhere = {
          OR: [
            { phone: norm },
            { phone: `+234${norm.slice(1)}` },
            { phone: rawIdentifier },
            { email: { equals: rawIdentifier.toLowerCase(), mode: 'insensitive' } },
          ],
        };
      } else {
        queryWhere = {
          OR: [
            { email: { equals: rawIdentifier.toLowerCase(), mode: 'insensitive' } },
            { phone: rawIdentifier },
          ],
        };
      }
    }

    // Find by email or phone
    const user = await this.prisma.user.findFirst({
      where: queryWhere,
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
    // 1. Email update check
    if (dto.email) {
      const normEmail = normalizeEmail(dto.email);
      if (normEmail) {
        const existingEmail = await this.prisma.user.findFirst({
          where: {
            id: { not: userId },
            email: { equals: normEmail, mode: 'insensitive' },
          },
        });
        if (existingEmail) {
          throw new ConflictException('This email address is already associated with another account');
        }
        await this.prisma.user.update({
          where: { id: userId },
          data: { email: normEmail },
        });
      }
    }

    // 2. Phone update check
    let normalizedPhone: string | null = null;
    if (dto.phone) {
      const phoneValidation = normalizePhoneNumber(dto.phone);
      if (!phoneValidation.isValid || !phoneValidation.normalized) {
        throw new BadRequestException(
          phoneValidation.error ||
            'Invalid phone number. Must be a valid 11-digit Nigerian phone number (e.g. 08012345678 or +2348012345678)',
        );
      }
      normalizedPhone = phoneValidation.normalized;

      const existingPhone = await this.prisma.user.findFirst({
        where: {
          id: { not: userId },
          OR: [
            { phone: normalizedPhone },
            { phone: `+234${normalizedPhone.slice(1)}` },
            { phone: normalizedPhone.slice(1) },
          ],
        },
      });
      if (existingPhone) {
        throw new ConflictException('This phone number is already associated with another account');
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { phone: normalizedPhone },
      });
    }

    const currentProfile = await this.prisma.memberProfile.findUnique({
      where: { userId },
    });

    const profileData: Record<string, unknown> = {};
    if (dto.firstName !== undefined) profileData.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) profileData.lastName = dto.lastName.trim();
    if (dto.middleName !== undefined) profileData.middleName = dto.middleName.trim() || null;
    if (normalizedPhone) profileData.phone = normalizedPhone;
    if (dto.nin !== undefined) profileData.nin = dto.nin.trim() || null;

    // Handle Voter Information update
    if (dto.isRegisteredVoter !== undefined) {
      profileData.isRegisteredVoter = dto.isRegisteredVoter;

      if (dto.isRegisteredVoter) {
        if (dto.voterCardNumber !== undefined) {
          profileData.voterCardNumber = dto.voterCardNumber.trim().toUpperCase() || null;
        }

        // When updating info as a voter, resolve electoral location fields
        if (
          dto.stateId ||
          dto.stateName ||
          dto.lgaId ||
          dto.lgaName ||
          dto.wardId ||
          dto.wardName ||
          dto.pollingUnitId ||
          dto.pollingUnitName
        ) {
          const loc = await this.resolveLocation(dto);
          if (loc.stateId !== null) profileData.stateId = loc.stateId;
          if (loc.lgaId !== null) profileData.lgaId = loc.lgaId;
          if (loc.wardId !== null) profileData.wardId = loc.wardId;
          if (loc.pollingUnitId !== null) profileData.pollingUnitId = loc.pollingUnitId;
        }
      } else {
        // Explicitly unregistering voter status: clear voter and PU records
        profileData.voterCardNumber = null;
        profileData.stateId = null;
        profileData.lgaId = null;
        profileData.wardId = null;
        profileData.pollingUnitId = null;
      }
    } else {
      // isRegisteredVoter flag was not toggled, but specific voter fields might be updated
      if (dto.voterCardNumber !== undefined) {
        profileData.voterCardNumber = dto.voterCardNumber.trim().toUpperCase() || null;
      }

      if (
        dto.stateId ||
        dto.stateName ||
        dto.lgaId ||
        dto.lgaName ||
        dto.wardId ||
        dto.wardName ||
        dto.pollingUnitId ||
        dto.pollingUnitName
      ) {
        const loc = await this.resolveLocation(dto);
        if (loc.stateId !== null) profileData.stateId = loc.stateId;
        if (loc.lgaId !== null) profileData.lgaId = loc.lgaId;
        if (loc.wardId !== null) profileData.wardId = loc.wardId;
        if (loc.pollingUnitId !== null) profileData.pollingUnitId = loc.pollingUnitId;
      }
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

  /**
   * Resolves INEC electoral location hierarchy into valid database records.
   * Auto-creates or maps State -> LGA -> Ward -> PollingUnit as needed.
   */
  private async resolveLocation(dto: {
    stateId?: string;
    stateName?: string;
    lgaId?: string;
    lgaName?: string;
    wardId?: string;
    wardName?: string;
    pollingUnitId?: string;
    pollingUnitName?: string;
  }) {
    let resolvedStateId: string | null = null;
    let resolvedLgaId: string | null = null;
    let resolvedWardId: string | null = null;
    let resolvedPollingUnitId: string | null = null;

    // Common INEC State IDs mapping
    const inecStateMap: Record<string, string> = {
      '28': 'Ogun',
      '27': 'Ogun',
      '24': 'Lagos',
      '25': 'Lagos',
      '1': 'Abia',
      '15': 'FCT',
      '37': 'FCT',
    };

    // 1. Resolve State
    if (dto.stateId || dto.stateName) {
      let state = dto.stateId
        ? await this.prisma.state.findUnique({ where: { id: dto.stateId } }).catch(() => null)
        : null;

      const stateNameCandidate =
        dto.stateName || (dto.stateId && inecStateMap[dto.stateId] ? inecStateMap[dto.stateId] : null);

      if (!state && stateNameCandidate) {
        // Strip numbers like "27 - OGUN", strip " State"
        const cleanName = stateNameCandidate
          .replace(/^\d+\s*-\s*/, '')
          .replace(/\s+state$/i, '')
          .trim();

        state = await this.prisma.state.findFirst({
          where: {
            OR: [
              { name: { equals: cleanName, mode: 'insensitive' } },
              { name: { contains: cleanName, mode: 'insensitive' } },
              { code: { equals: cleanName.substring(0, 3).toUpperCase() } },
              { code: { equals: cleanName.substring(0, 2).toUpperCase() } },
            ],
          },
        });

        if (!state) {
          try {
            state = await this.prisma.state.create({
              data: {
                name: cleanName,
                code: cleanName.substring(0, 3).toUpperCase(),
              },
            });
          } catch {
            state = await this.prisma.state.findFirst({
              where: { name: { contains: cleanName, mode: 'insensitive' } },
            });
          }
        }
      }
      resolvedStateId = state?.id ?? null;
    }

    // 2. Resolve LGA
    if (resolvedStateId && (dto.lgaId || dto.lgaName)) {
      let lga = dto.lgaId
        ? await this.prisma.lGA.findUnique({ where: { id: dto.lgaId } }).catch(() => null)
        : null;

      if (!lga && dto.lgaName) {
        const cleanName = dto.lgaName.replace(/^\d+\s*-\s*/, '').trim();
        lga = await this.prisma.lGA.findFirst({
          where: {
            stateId: resolvedStateId,
            OR: [
              { name: { equals: cleanName, mode: 'insensitive' } },
              { name: { contains: cleanName, mode: 'insensitive' } },
            ],
          },
        });

        if (!lga) {
          try {
            lga = await this.prisma.lGA.create({
              data: {
                name: cleanName,
                stateId: resolvedStateId,
              },
            });
          } catch {
            lga = await this.prisma.lGA.findFirst({
              where: {
                stateId: resolvedStateId,
                name: { contains: cleanName, mode: 'insensitive' },
              },
            });
          }
        }
      }
      resolvedLgaId = lga?.id ?? null;
    }

    // 3. Resolve Ward
    if (resolvedLgaId && (dto.wardId || dto.wardName)) {
      let ward = dto.wardId
        ? await this.prisma.ward.findUnique({ where: { id: dto.wardId } }).catch(() => null)
        : null;

      if (!ward && dto.wardName) {
        const cleanName = dto.wardName.replace(/^\d+\s*-\s*/, '').trim();
        ward = await this.prisma.ward.findFirst({
          where: {
            lgaId: resolvedLgaId,
            OR: [
              { name: { equals: cleanName, mode: 'insensitive' } },
              { name: { contains: cleanName, mode: 'insensitive' } },
            ],
          },
        });

        if (!ward) {
          try {
            ward = await this.prisma.ward.create({
              data: {
                name: cleanName,
                lgaId: resolvedLgaId,
              },
            });
          } catch {
            ward = await this.prisma.ward.findFirst({
              where: {
                lgaId: resolvedLgaId,
                name: { contains: cleanName, mode: 'insensitive' },
              },
            });
          }
        }
      }
      resolvedWardId = ward?.id ?? null;
    }

    // 4. Resolve Polling Unit
    if (resolvedWardId && (dto.pollingUnitId || dto.pollingUnitName)) {
      let pu = dto.pollingUnitId
        ? await this.prisma.pollingUnit.findUnique({ where: { id: dto.pollingUnitId } }).catch(() => null)
        : null;

      if (!pu && dto.pollingUnitName) {
        const cleanName = dto.pollingUnitName.trim();
        pu = await this.prisma.pollingUnit.findFirst({
          where: {
            wardId: resolvedWardId,
            OR: [
              { name: { equals: cleanName, mode: 'insensitive' } },
              { name: { contains: cleanName, mode: 'insensitive' } },
            ],
          },
        });

        if (!pu) {
          const codeMatch = cleanName.match(/^(\d{1,4})/);
          try {
            pu = await this.prisma.pollingUnit.create({
              data: {
                name: cleanName,
                code: codeMatch ? codeMatch[1] : undefined,
                wardId: resolvedWardId,
              },
            });
          } catch {
            pu = await this.prisma.pollingUnit.findFirst({
              where: {
                wardId: resolvedWardId,
                name: { equals: cleanName, mode: 'insensitive' },
              },
            });
          }
        }
      }
      resolvedPollingUnitId = pu?.id ?? null;
    }

    return {
      stateId: resolvedStateId,
      lgaId: resolvedLgaId,
      wardId: resolvedWardId,
      pollingUnitId: resolvedPollingUnitId,
    };
  }
}
