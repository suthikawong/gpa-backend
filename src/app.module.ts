import { Module } from '@nestjs/common';
import { AssessmentModule } from './assessment/assessment.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GroupModule } from './group/group.module';

@Module({
  imports: [UserModule, AuthModule, AssessmentModule, GroupModule],
  providers: [],
  controllers: [],
})
export class AppModule {}
