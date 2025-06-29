import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import { ModelLookupResponse } from './dto/lookup.response';

@Injectable()
export class LookupService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async getModels(): Promise<ModelLookupResponse> {
    return await this.db.query.models.findMany();
  }
}
