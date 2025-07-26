import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssessmentModule } from '../assessment/assessment.module';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { PeerRatingModule } from '../peer-rating/peer-rating.module';
import { UserModule } from '../user/user.module';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AssessmentModule,
    UserModule,
    PeerRatingModule,
  ],
  providers: [GroupService],
  controllers: [GroupController],
  exports: [GroupService],
})
export class GroupModule {}
