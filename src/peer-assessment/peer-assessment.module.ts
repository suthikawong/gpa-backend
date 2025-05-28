import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { GroupModule } from '../group/group.module';
import { PeerAssessmentController } from './peer-assessment.controller';
import { PeerAssessmentService } from './peer-assessment.service';

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.forRoot({ isGlobal: true }),
    GroupModule,
  ],
  controllers: [PeerAssessmentController],
  providers: [PeerAssessmentService],
})
export class PeerAssessmentModule {}
