import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { ModelController } from './model.controller';
import { ModelService } from './model.service';

@Module({
  imports: [DrizzleModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [ModelController],
  providers: [ModelService],
})
export class ModelModule {}
