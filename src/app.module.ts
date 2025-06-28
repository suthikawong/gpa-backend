import { Module } from '@nestjs/common';
import { AssessmentModule } from './assessment/assessment.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [UserModule, AuthModule, AssessmentModule],
  providers: [],
  controllers: [],
})
export class AppModule {}
