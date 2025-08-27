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

  @Put('profile')
  @UseInterceptors(FileInterceptor('file'))
  async importGroups(
    @Body() data: UpdateProfileRequest,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AppResponse<UpdateProfileResponse>> {
    const result = await this.userService.updateProfile(data, file);
    return { data: result };
  }
}
