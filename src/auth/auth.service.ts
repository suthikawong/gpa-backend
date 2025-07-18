import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Response } from 'express';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import { User } from '../drizzle/schema';
import { UserService } from '../user/user.service';
import { RegisterRequest } from './dto/auth.request';
import { LoginResponse } from './dto/auth.response';
import { TokenPayload } from './token-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,

    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(user: User, response: Response): Promise<LoginResponse> {
    const expireAccessToken = new Date(
      Date.now() +
        parseInt(
          this.configService.getOrThrow<string>(
            'JWT_ACCESS_TOKEN_EXPIRATION_MS',
          ),
        ),
    );
    const expireRefreshToken = new Date(
      Date.now() +
        parseInt(
          this.configService.getOrThrow<string>(
            'JWT_REFRESH_TOKEN_EXPIRATION_MS',
          ),
        ),
    );
    const tokenPayload: TokenPayload = {
      userId: user.userId,
    };
    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_MS')}ms`,
    });
    const refreshToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION_MS')}ms`,
    });

    await this.db
      .update(schema.users)
      .set({ refreshToken: await hash(refreshToken, 10) })
      .where(eq(schema.users.userId, user.userId))
      .returning();

    response.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite:
        this.configService.get('NODE_ENV') === 'production'
          ? 'none'
          : undefined,
      expires: expireAccessToken,
      path: '/',
    });

    response.cookie('RefreshToken', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite:
        this.configService.get('NODE_ENV') === 'production'
          ? 'none'
          : undefined,
      expires: expireRefreshToken,
      path: '/',
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

  async verifyRefreshToken(refreshToken: string, userId: number) {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user.refreshToken) throw new UnauthorizedException();

      const authenticated = await compare(refreshToken, user.refreshToken);
      if (!authenticated) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (err) {
      throw new UnauthorizedException('Refresh token is not valid.');
    }
  }

  async logout(response: Response) {
    response.clearCookie('Authentication', {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite:
        this.configService.get('NODE_ENV') === 'production'
          ? 'none'
          : undefined,
      path: '/',
    });
    response.clearCookie('RefreshToken', {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite:
        this.configService.get('NODE_ENV') === 'production'
          ? 'none'
          : undefined,
      path: '/',
    });
  }

  async register(data: RegisterRequest) {
    const existing = await this.db.query.users.findFirst({
      where: eq(schema.users.email, data.email),
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const user = await this.userService.createUser(data);
    return { userId: user.userId };
  }
}
