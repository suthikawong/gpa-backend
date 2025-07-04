import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { LoggedInUser } from '../auth/decorators/logged-in-user.decorator';
import { User } from '../drizzle/schema';
import { AppResponse } from '../app.response';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CatsService } from './cats.service';
import { CreateCatRequest } from './dto/cats.request';
import { CreateCatResponse, GetCatResponse } from './dto/cats.response';

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Post()
  async create(
    @Body() createCatDto: CreateCatRequest,
  ): Promise<AppResponse<CreateCatResponse>> {
    const data = await this.catsService.create(createCatDto);
    return { data };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @LoggedInUser() user: User,
  ): Promise<AppResponse<GetCatResponse>> {
    console.log(user);
    const data = await this.catsService.findAll();
    return { data };
  }
}
