import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AppResponse } from '../app.response';
import { User } from '../drizzle/schema';
import { AuthService } from './auth.service';
import { GetLoggedInUserResponse, LoginResponse } from './dto/auth.response';
import { LocalAuthGuard } from './guards/auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoggedInUser } from './logged-in-user.decorator';

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
}
