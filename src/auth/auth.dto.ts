import { IsEmail, IsOptional, IsString, MinLength, Matches, IsBoolean, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s\-\(\)\.]/g, '').trim() : value))
  @Matches(/^(\+?234|0)[789][01]\d{8}$/, {
    message: 'Invalid phone number. Must be a valid 11-digit Nigerian phone number (e.g. 08012345678 or +2348012345678)',
  })
  phone?: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  // Organizational location
  @IsOptional()
  @IsString()
  stateId?: string;

  @IsOptional()
  @IsString()
  stateName?: string;

  @IsOptional()
  @IsString()
  lgaId?: string;

  @IsOptional()
  @IsString()
  lgaName?: string;

  @IsOptional()
  @IsString()
  wardId?: string;

  @IsOptional()
  @IsString()
  wardName?: string;

  @IsOptional()
  @IsString()
  pollingUnitId?: string;

  @IsOptional()
  @IsString()
  pollingUnitName?: string;

  // Voter info
  @IsOptional()
  @IsBoolean()
  isRegisteredVoter?: boolean;

  @IsOptional()
  @IsString()
  @Length(20, 20, { message: 'VIN must be exactly 20 characters' })
  voterCardNumber?: string;

  @IsOptional()
  @IsString()
  @Length(11, 11, { message: 'NIN must be exactly 11 digits' })
  nin?: string;
}

export class LoginDto {
  @IsString()
  identifier: string; // email or phone

  @IsString()
  password: string;
}

export class VerifyAccountDto {
  @IsString()
  token: string;
}

export class ForgotPasswordDto {
  @IsString()
  identifier: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s\-\(\)\.]/g, '').trim() : value))
  @Matches(/^(\+?234|0)[789][01]\d{8}$/, {
    message: 'Invalid phone number. Must be a valid 11-digit Nigerian phone number (e.g. 08012345678 or +2348012345678)',
  })
  phone?: string;

  // Organizational location
  @IsOptional()
  @IsString()
  stateId?: string;

  @IsOptional()
  @IsString()
  stateName?: string;

  @IsOptional()
  @IsString()
  lgaId?: string;

  @IsOptional()
  @IsString()
  lgaName?: string;

  @IsOptional()
  @IsString()
  wardId?: string;

  @IsOptional()
  @IsString()
  wardName?: string;

  @IsOptional()
  @IsString()
  pollingUnitId?: string;

  @IsOptional()
  @IsString()
  pollingUnitName?: string;

  // Voter info
  @IsOptional()
  @IsBoolean()
  isRegisteredVoter?: boolean;

  @IsOptional()
  @IsString()
  @Length(20, 20, { message: 'VIN must be exactly 20 characters' })
  voterCardNumber?: string;

  @IsOptional()
  @IsString()
  @Length(11, 11, { message: 'NIN must be exactly 11 digits' })
  nin?: string;
}

export class UpdatePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword: string;
}
