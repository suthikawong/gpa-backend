import { Injectable } from '@nestjs/common';
import { CreateCatRequest } from 'dtos/cats/cats-request.dto';
import { Cat } from 'dtos/cats/cats-response.dto';
import { db } from 'src/db';
import { catsTable } from 'src/db/schema/cat';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  async create(cat: CreateCatRequest): Promise<Cat> {
    this.cats.push(cat);
    const data: typeof catsTable.$inferInsert = {
      name: cat.name,
      age: cat.age,
      breed: cat.breed,
    };
    await db.insert(catsTable).values(data);
    return cat;
  }

  async findAll(): Promise<Cat[]> {
    return await db.select().from(catsTable);
  }
}
