import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AppResponse } from '../app.response';
import { User } from '../drizzle/schema';
import { AuthService } from './auth.service';
import { LoggedInUser } from './decorators/logged-in-user.decorator';
import {
  ForgotPasswordRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from './dto/auth.request';
import {
  ForgotPasswordResponse,
  GetLoggedInUserResponse,
  LoginResponse,
  RegisterResponse,
  ResetPasswordResponse,
  VerifyEmailResponse,
} from './dto/auth.response';
import { LocalAuthGuard } from './guards/auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @LoggedInUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AppResponse<LoginResponse>> {
    const data = await this.authService.login(user, response);
    return { data };
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  async refreshToken(
    @LoggedInUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AppResponse<LoginResponse>> {
    const data = await this.authService.login(user, response);
    return { data };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    this.authService.logout(response);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getLoggedInUser(
    @LoggedInUser() user: User,
  ): Promise<AppResponse<GetLoggedInUserResponse>> {
    const data = { ...user, password: undefined, refreshToken: undefined };
    return { data };
  }

  @Post('register')
  async registerInstructor(
    @Body() data: RegisterRequest,
  ): Promise<AppResponse<RegisterResponse>> {
    const result = await this.authService.register(data);
    return { data: result };
  }

  @Get('verify-email')
  async verifyEmail(
    @Query() query: VerifyEmailRequest,
  ): Promise<AppResponse<VerifyEmailResponse>> {
    const result = await this.authService.verifyEmail(query);
    return { data: result };
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() data: ForgotPasswordRequest,
  ): Promise<AppResponse<ForgotPasswordResponse>> {
    const result = await this.authService.forgotPassword(data);
    return { data: result };
  }

  @Post('reset-password')
  async resetPassword(
    @Body() data: ResetPasswordRequest,
  ): Promise<AppResponse<ResetPasswordResponse>> {
    const result = await this.authService.resetPassword(data);
    return { data: result };
  }
}
