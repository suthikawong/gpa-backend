import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DrizzleModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
