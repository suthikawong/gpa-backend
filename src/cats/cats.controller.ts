import { Body, Controller, Get, Post } from '@nestjs/common';
import { CatsService } from './cats.service';
import { AppResponse } from 'dtos/app';
import { CreateCatRequest } from 'dtos/cats/cats-request.dto';
import { CreateCatResponse, GetCatResponse } from 'dtos/cats/cats-response.dto';

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
  async findAll(): Promise<AppResponse<GetCatResponse[]>> {
    const data = await this.catsService.findAll();
    console.log('first');
    return { data };
  }
}
