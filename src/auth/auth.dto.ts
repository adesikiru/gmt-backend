import { IsEmail, IsOptional, IsString, MinLength, Matches, IsBoolean, Length, IsUUID } from 'class-validator';

export class RegisterDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^(\+234|0)[789][01]\d{8}$/, { message: 'Invalid Nigerian phone number' })
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
  @IsUUID()
  stateId?: string;

  @IsOptional()
  @IsUUID()
  lgaId?: string;

  @IsOptional()
  @IsUUID()
  wardId?: string;

  @IsOptional()
  @IsUUID()
  pollingUnitId?: string;

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
