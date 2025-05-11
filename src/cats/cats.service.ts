import { Inject, Injectable } from '@nestjs/common';
import { CreateCatRequest } from './dto/cats.request';
import { CreateCatResponse, GetCatResponse } from './dto/cats.response';
import * as schema from '../drizzle/schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class CatsService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateCatRequest): Promise<CreateCatResponse> {
    const result = await this.db.insert(schema.cats).values(data).returning();
    return result?.[0] ?? null;
  }

  async findAll(): Promise<GetCatResponse> {
    // return await this.db.select().from(schema.cats);
    return await this.db.query.cats.findMany();
  }
}
