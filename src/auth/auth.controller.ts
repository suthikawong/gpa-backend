import { Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { User } from '../drizzle/schema';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/auth.guard';
import { LoggedInUser } from './logged-in-user.decorator';
import { LoginResponse } from './dto/auth.response';
import { AppResponse } from 'src/app.response';

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
}
