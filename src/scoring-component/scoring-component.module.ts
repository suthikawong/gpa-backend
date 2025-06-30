import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssessmentModule } from '../assessment/assessment.module';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { ScoringComponentController } from './scoring-component.controller';
import { ScoringComponentService } from './scoring-component.service';

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AssessmentModule,
  ],
  providers: [ScoringComponentService],
  controllers: [ScoringComponentController],
  exports: [ScoringComponentService],
})
export class ScoringComponentModule {}
