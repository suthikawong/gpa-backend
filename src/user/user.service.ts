import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { plainToInstance } from 'class-transformer';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import {
  CreateUserRequest,
  GetUserByEmailRequest,
  UpdateProfileRequest,
  UpdateUserRequest,
} from './dto/user.request';
import {
  CreateUserResponse,
  GetUserByEmailResponse,
  GetUserByIdResponse,
} from './dto/user.response';
import { UserProtected } from './user.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
    const [user] = await this.db
      .insert(schema.users)
      .values({
        ...data,
        password: await hash(data.password, 10),
        createdDate: new Date(),
      })
      .returning();

    const result = plainToInstance(UserProtected, user);
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
      .set({
        ...data,
        userNumber: data?.userNumber ?? null,
        updatedDate: new Date(),
      })
      .where(eq(schema.users.userId, data.userId))
      .returning();

    const result = plainToInstance(UserProtected, user);
    return result;
  }

  async updateProfile(data: UpdateProfileRequest, file?: Express.Multer.File) {
    let imageUrl = data?.image ?? null;
    if (file) {
      const uploaded = await this.cloudinaryService.uploadImage(file);
      imageUrl = uploaded.secure_url;
    }

    const result = await this.updateUser({ ...data, image: imageUrl });
    return result;
  }
}
