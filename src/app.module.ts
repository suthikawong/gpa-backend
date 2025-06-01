import { Module } from '@nestjs/common';
import { AssessmentPeriodModule } from './assessment-period/assessment-period.module';
import { AssignmentModule } from './assignment/assignment.module';
import { AuthModule } from './auth/auth.module';
import { CatsModule } from './cats/cats.module';
import { ClassroomModule } from './classroom/classroom.module';
import { CriterionModule } from './criterion/criterion.module';
import { GroupModule } from './group/group.module';
import { LookupModule } from './lookup/lookup.module';
import { ModelModule } from './model/model.module';
import { PeerAssessmentModule } from './peer-assessment/peer-assessment.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    CatsModule,
    ModelModule,
    UserModule,
    AuthModule,
    ClassroomModule,
    AssignmentModule,
    GroupModule,
    CriterionModule,
    AssessmentPeriodModule,
    PeerAssessmentModule,
    LookupModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
