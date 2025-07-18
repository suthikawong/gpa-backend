import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { LookupController } from './lookup.controller';
import { LookupService } from './lookup.service';

@Module({
  imports: [DrizzleModule, ConfigModule.forRoot({ isGlobal: true })],
  providers: [LookupService],
  controllers: [LookupController],
})
export class LookupModule {}
