import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GroupModule } from 'src/group/group.module';
import { ScoringComponentModule } from 'src/scoring-component/scoring-component.module';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { PeerRatingController } from './peer-rating.controller';
import { PeerRatingService } from './peer-rating.service';

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.forRoot({ isGlobal: true }),
    GroupModule,
    ScoringComponentModule,
  ],
  providers: [PeerRatingService],
  controllers: [PeerRatingController],
})
export class PeerRatingModule {}
