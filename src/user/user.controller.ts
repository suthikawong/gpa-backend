import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { AppResponse } from '../app.response';
import {
  CreateUserRequest,
  GetUserByIdRequest,
  UpdateUserRequest,
} from './dto/user.request';
import {
  CreateUserResponse,
  GetUserByIdResponse,
  UpdateUserResponse,
} from './dto/user.response';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':userId')
  async getUserById(
    @Param() data: GetUserByIdRequest,
  ): Promise<AppResponse<GetUserByIdResponse>> {
    const user = await this.userService.getUserById(data.userId);
    return { data: user };
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
