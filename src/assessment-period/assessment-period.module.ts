import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssignmentModule } from '../assignment/assignment.module';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { AssessmentPeriodController } from './assessment-period.controller';
import { AssessmentPeriodService } from './assessment-period.service';

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AssignmentModule,
  ],
  controllers: [AssessmentPeriodController],
  providers: [AssessmentPeriodService],
})
export class AssessmentPeriodModule {}
