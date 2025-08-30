import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { AppResponse } from '../app.response';
import { User } from '../drizzle/schema';
import { UserProtected } from '../user/user.interface';
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
    try {
      const data = await this.authService.login(user, response);
      return { data };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  async refreshToken(
    @LoggedInUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AppResponse<LoginResponse>> {
    try {
      const data = await this.authService.login(user, response);
      return { data };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    try {
      this.authService.logout(response);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getLoggedInUser(
    @LoggedInUser() user: User,
  ): Promise<AppResponse<GetLoggedInUserResponse>> {
    try {
      return { data: plainToInstance(UserProtected, user) };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post('register')
  async registerInstructor(
    @Body() data: RegisterRequest,
  ): Promise<AppResponse<RegisterResponse>> {
    try {
      const result = await this.authService.register(data);
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Get('verify-email')
  async verifyEmail(
    @Query() query: VerifyEmailRequest,
  ): Promise<AppResponse<VerifyEmailResponse>> {
    try {
      const result = await this.authService.verifyEmail(query);
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() data: ForgotPasswordRequest,
  ): Promise<AppResponse<ForgotPasswordResponse>> {
    try {
      const result = await this.authService.forgotPassword(data);
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post('reset-password')
  async resetPassword(
    @Body() data: ResetPasswordRequest,
  ): Promise<AppResponse<ResetPasswordResponse>> {
    try {
      const result = await this.authService.resetPassword(data);
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
