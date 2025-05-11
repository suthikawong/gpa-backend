import { Injectable } from '@nestjs/common';
import { CreateCatRequest } from './dto/cats.request';
import { CreateCatResponse, GetCatResponse } from './dto/cats.response';
import { db } from '../db';
import { catsTable } from '../db/schema/cat';

@Injectable()
export class CatsService {
  async create(cat: CreateCatRequest): Promise<CreateCatResponse> {
    const data: typeof catsTable.$inferInsert = {
      name: cat.name,
      age: cat.age,
      breed: cat.breed,
    };
    const result = await db.insert(catsTable).values(data).returning();
    return result?.[0] ?? null;
  }

  async findAll(): Promise<GetCatResponse> {
    return await db.select().from(catsTable);
  }
}
