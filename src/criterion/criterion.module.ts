import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssignmentModule } from 'src/assignment/assignment.module';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { CriterionController } from './criterion.controller';
import { CriterionService } from './criterion.service';

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AssignmentModule,
  ],
  controllers: [CriterionController],
  providers: [CriterionService],
})
export class CriterionModule {}
