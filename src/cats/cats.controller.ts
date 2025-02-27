import { Controller, Get, Post, Body } from '@nestjs/common';
import { CatsService } from './cats.service';

export interface Cat {
  name: string;
  age: number;
  breed: string;
}

interface CreateCatDto {
  name: string;
  age: number;
  breed: string;
}

export interface AppResponse<T> {
  data: T;
  total?: number;
}

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Post()
  create(@Body() createCatDto: CreateCatDto): AppResponse<Cat> {
    const data = this.catsService.create(createCatDto);
    return { data };
  }

  @Get()
  findAll(): AppResponse<Cat[]> {
    const data = this.catsService.findAll();
    return { data, total: 1 };
  }
}
