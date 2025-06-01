import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import { GetInstitutesResponse } from './dto/lookup.response';

@Injectable()
export class LookupService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async getInstitutes(): Promise<GetInstitutesResponse> {
    const institutes = await this.db.query.institutes.findMany();
    return institutes;
  }
}
