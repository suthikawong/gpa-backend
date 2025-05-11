import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateUserRequest,
  GetUserByIdRequest,
  UpdateUserRequest,
} from './dto/user.request';
import { CreateUserResponse, GetUserByIdResponse } from './dto/user.response';
import { hash } from 'bcryptjs';
import * as schema from '../drizzle/schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

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
      .returning({ id: schema.users.id, email: schema.users.email });
    return user;
  }

  async getUserById(data: GetUserByIdRequest): Promise<GetUserByIdResponse> {
    const user = await this.db.query.users.findFirst({
      columns: {
        password: false,
        refreshToken: false,
      },
      where: eq(schema.users.id, data.id),
    });
    return user || null;
  }

  async updateUser(data: UpdateUserRequest) {
    const result = await this.getUserById(data);
    if (!result) throw new NotFoundException('User not found');

    const [user] = await this.db
      .update(schema.users)
      .set(data)
      .where(eq(schema.users.id, data.id))
      .returning({ id: schema.users.id, email: schema.users.email });
    return user;
  }
}
