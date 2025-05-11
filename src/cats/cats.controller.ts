import { Body, Controller, Get, Post } from '@nestjs/common';
import { CatsService } from './cats.service';
import { AppResponse } from '../app.response';
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
  async findAll(): Promise<AppResponse<GetCatResponse>> {
    const data = await this.catsService.findAll();
    return { data };
  }
}
