import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';

@Module({
  imports: [DrizzleModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AssessmentController],
  providers: [AssessmentService],
})
export class AssessmentModule {}
