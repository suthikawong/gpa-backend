import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Response } from 'express';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import { User } from '../drizzle/schema';
import { MailService } from '../mail/mail.service';
import { UserService } from '../user/user.service';
import {
  ForgotPasswordRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from './dto/auth.request';
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
    private readonly mailService: MailService,
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
    let user: schema.User | null = null;
    try {
      user = await this.userService.getUserByEmail({ email });
    } catch (error) {
      throw new UnauthorizedException('Incorrect email or password.');
    }
    const authenticated = await compare(password, user.password);
    if (!authenticated) {
      throw new UnauthorizedException('Incorrect email or password.');
    }
    if (!user.isVerified) {
      const verificationToken = randomBytes(32).toString('hex');
      await this.userService.updateUser({
        userId: user.userId,
        isVerified: false,
        verificationToken,
      });
      await this.sendVerificationEmail(user.email, verificationToken);
      throw new ForbiddenException(
        'Your email is not verified. Please verify your email before sign in',
      );
    }
    return user;
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

    const verificationToken = randomBytes(32).toString('hex');
    const user = await this.userService.createUser({
      ...data,
      isVerified: false,
      verificationToken,
    });
    await this.sendVerificationEmail(user.email, verificationToken);
    return { userId: user.userId };
  }

  async verifyEmail(data: VerifyEmailRequest) {
    if (!data?.token) throw new NotFoundException('Invalid token');

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.verificationToken, data.token),
    });
    if (!user) throw new NotFoundException('Invalid token');

    await this.userService.updateUser({
      userId: user.userId,
      isVerified: true,
      verificationToken: null,
    });

    return { userId: user.userId };
  }

  async forgotPassword(data: ForgotPasswordRequest) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, data.email),
    });

    if (!user) throw new NotFoundException('Email not found');

    const token = this.jwtService.sign(
      { email: data.email },
      {
        secret: this.configService.getOrThrow('JWT_RESET_TOKEN_SECRET'),
        expiresIn: `${this.configService.getOrThrow('JWT_RESET_TOKEN_EXPIRATION_MS')}ms`,
      },
    );

    await this.userService.updateUser({
      userId: user.userId,
      resetPasswordToken: token,
    });

    await this.sendResetPasswordEmail(user.email, token);
    return { userId: user.userId };
  }

  async resetPassword(data: ResetPasswordRequest) {
    if (!data?.token) throw new NotFoundException('Invalid token');

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.resetPasswordToken, data.token),
    });

    if (!user) throw new NotFoundException('Invalid token');

    const payload = await this.decodeJwtToken(
      data.token,
      this.configService.get('JWT_RESET_TOKEN_SECRET')!,
    );

    if (!payload?.email) throw new NotFoundException('Invalid token');

    await this.userService.updateUser({
      userId: user.userId,
      password: data.password,
      resetPasswordToken: null,
    });

    return { userId: user.userId };
  }

  async sendVerificationEmail(email: string, token: string) {
    const sendTo = [email];
    const subject = 'Verify Your Email Address';
    const url = `${process.env.FRONTEND_APP_URL}/verify-email?token=${token}`;
    const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
      <h2 style="color: #333;">Welcome to ScoreUnity!</h2>
      <p style="font-size: 16px; color: #555;">
        Thank you for signing up. To complete your registration, please verify your email address by clicking the button below:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="background-color: #007BFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px;">
          Verify Email
        </a>
      </div>
      <p style="font-size: 14px; color: #777;">
        If you did not create an account, no further action is required.
      </p>
    </div>`;
    await this.mailService.sendEmail({ sendTo, subject, html });
  }

  async sendResetPasswordEmail(email: string, token: string) {
    const sendTo = [email];
    const subject = 'Reset Your Password';
    const url = `${process.env.FRONTEND_APP_URL}/reset-password?token=${token}`;
    const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
      <h2 style="color: #333;">Reset Your Password</h2>
      <p style="font-size: 16px; color: #555;">
        We received a request to reset your password. Click the button below to reset your password:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="background-color: #007BFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px;">
          Reset Password
        </a>
      </div>
      <p style="font-size: 14px; color: #777;">
        If you did not request this, please ignore this email. This link will expire in 1 hour for security reasons.
      </p>
    </div>`;
    await this.mailService.sendEmail({ sendTo, subject, html });
  }

  public async decodeJwtToken(token: string, secret: string) {
    try {
      const payload = await this.jwtService.verify(token, { secret });
      return payload;
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException('Token expired');
      }
      throw new BadRequestException('Invalid token');
    }
  }
}
