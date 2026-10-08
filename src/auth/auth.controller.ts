import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto, LoginDto, VerifyAccountDto } from './auth.dto.js';
import { JwtAuthGuard } from '../common/guards/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { successResponse } from '../common/api-response.js';
import type { User } from '@prisma/client';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return successResponse(data, 'Registration successful. Please verify your account.');
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return successResponse(data, 'Login successful');
  }

  @Post('verify/:token')
  async verify(@Param('token') token: string) {
    const data = await this.authService.verifyAccount(token);
    return successResponse(data, 'Account verified');
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: User) {
    const data = await this.authService.getProfile(user.id);
    return successResponse(data);
  }
}
