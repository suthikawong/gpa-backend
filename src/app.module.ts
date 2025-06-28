import { Module } from '@nestjs/common';
import { AssessmentModule } from './assessment/assessment.module';
import { AuthModule } from './auth/auth.module';
import { GroupModule } from './group/group.module';
import { ScoringComponentModule } from './scoring-component/scoring-component.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    AssessmentModule,
    GroupModule,
    ScoringComponentModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
