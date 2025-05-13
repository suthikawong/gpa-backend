import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { Response } from 'express';
import { User } from '../drizzle/schema';
import { UserService } from '../user/user.service';
import { TokenPayload } from './token-payload.interface';
import { LoginResponse } from './dto/auth.response';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(user: User, response: Response): Promise<LoginResponse> {
    const expireAccessToken = new Date(
      Date.now() +
        parseInt(this.configService.getOrThrow<string>('JWT_EXPIRATION_MS')),
    );
    const tokenPayload: TokenPayload = {
      userId: user.id,
    };
    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow('JWT_SECRET'),
      expiresIn: `${this.configService.getOrThrow('JWT_EXPIRATION_MS')}ms`,
    });

    response.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'none',
      expires: expireAccessToken,
    });
    const result = { ...user, password: undefined, refreshToken: undefined };
    return result;
  }

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.userService.getUserByEmail({ email });
      const authenticated = await compare(password, user.password);
      if (!authenticated) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException('Incorrect email or password.');
    }
  }

  async logout(response: Response) {
    response.clearCookie('Authentication');
  }
}
