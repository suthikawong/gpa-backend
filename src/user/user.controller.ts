import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppResponse } from '../app.response';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateUserRequest,
  GetUserByIdRequest,
  UpdateProfileRequest,
  UpdateUserRequest,
} from './dto/user.request';
import {
  CreateUserResponse,
  GetUserByIdResponse,
  UpdateProfileResponse,
  UpdateUserResponse,
} from './dto/user.response';
import { UserService } from './user.service';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':userId')
  async getUserById(
    @Param() data: GetUserByIdRequest,
  ): Promise<AppResponse<GetUserByIdResponse>> {
    try {
      const user = await this.userService.getUserById(data.userId);
      return { data: user };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post()
  async createUser(
    @Body() data: CreateUserRequest,
  ): Promise<AppResponse<CreateUserResponse>> {
    try {
      const user = await this.userService.createUser(data);
      return { data: user };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Put()
  async updateUser(
    @Body() data: UpdateUserRequest,
  ): Promise<AppResponse<UpdateUserResponse>> {
    try {
      const user = await this.userService.updateUser(data);
      return { data: user };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Put('profile')
  @UseInterceptors(FileInterceptor('file'))
  async importGroups(
    @Body() data: UpdateProfileRequest,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AppResponse<UpdateProfileResponse>> {
    try {
      const result = await this.userService.updateProfile(data, file);
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
