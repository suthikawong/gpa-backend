import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { ScoringComponentModule } from '../scoring-component/scoring-component.module';
import { PeerRatingController } from './peer-rating.controller';
import { PeerRatingService } from './peer-rating.service';

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ScoringComponentModule,
  ],
  providers: [PeerRatingService],
  controllers: [PeerRatingController],
  exports: [PeerRatingService],
})
export class PeerRatingModule {}
