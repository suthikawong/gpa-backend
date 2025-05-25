import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import {
  CreateUserRequest,
  GetUserByEmailRequest,
  UpdateUserRequest,
} from './dto/user.request';
import {
  CreateUserResponse,
  GetUserByEmailResponse,
  GetUserByIdResponse,
} from './dto/user.response';

@Injectable()
export class UserService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
    const [user] = await this.db
      .insert(schema.users)
      .values({ ...data, password: await hash(data.password, 10) })
      .returning();

    const result = {
      ...user,
      password: undefined,
      refreshToken: undefined,
    };
    return result;
  }

  async getUserById(
    userId: schema.User['userId'],
  ): Promise<GetUserByIdResponse> {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.userId, userId),
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUserByEmail(
    data: GetUserByEmailRequest,
  ): Promise<GetUserByEmailResponse> {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, data.email),
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(data: UpdateUserRequest) {
    await this.getUserById(data.userId);
    if (data.password) data.password = await hash(data.password, 10);

    const [user] = await this.db
      .update(schema.users)
      .set(data)
      .where(eq(schema.users.userId, data.userId))
      .returning();

    const result = {
      ...user,
      password: undefined,
      refreshToken: undefined,
    };
    return result;
  }
}
