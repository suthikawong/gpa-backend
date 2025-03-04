import { Injectable } from '@nestjs/common';
import { db } from 'src/db';
import { catTable } from 'src/db/schema/cat';
import { Cat } from './cats.controller';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  async create(cat: Cat): Promise<Cat> {
    this.cats.push(cat);
    const data: typeof catTable.$inferInsert = {
      name: cat.name,
      age: cat.age,
      breed: cat.breed,
    };
    await db.insert(catTable).values(data);
    return cat;
  }

  async findAll(): Promise<Cat[]> {
    return await db.select().from(catTable);
  }
}
