import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { User } from 'src/drizzle/schema';
import { AppResponse } from '../app.response';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoggedInUser } from '../auth/logged-in-user.decorator';
import {
  CreateUserRequest,
  GetUserByIdRequest,
  UpdateUserRequest,
} from './dto/user.request';
import {
  CreateUserResponse,
  GetLoggedInUserResponse,
  GetUserByIdResponse,
  UpdateUserResponse,
} from './dto/user.response';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id')
  async getUserById(
    @Param() data: GetUserByIdRequest,
  ): Promise<AppResponse<GetUserByIdResponse>> {
    const user = await this.userService.getUserById(data);
    return { data: user };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getLoggedInUser(
    @LoggedInUser() user: User,
  ): Promise<AppResponse<GetLoggedInUserResponse>> {
    const data = { ...user, password: undefined, refreshToken: undefined };
    return { data };
  }

  @Post()
  async createUser(
    @Body() data: CreateUserRequest,
  ): Promise<AppResponse<CreateUserResponse>> {
    const user = await this.userService.createUser(data);
    return { data: user };
  }

  @Put()
  async updateUser(
    @Body() data: UpdateUserRequest,
  ): Promise<AppResponse<UpdateUserResponse>> {
    const user = await this.userService.updateUser(data);
    return { data: user };
  }
}
