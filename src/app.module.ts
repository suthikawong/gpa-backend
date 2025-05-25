import { Module } from '@nestjs/common';
import { AssignmentModule } from './assignment/assignment.module';
import { AuthModule } from './auth/auth.module';
import { CatsModule } from './cats/cats.module';
import { ClassroomModule } from './classroom/classroom.module';
import { GroupModule } from './group/group.module';
import { ModelController } from './model/model.controller';
import { ModelModule } from './model/model.module';
import { ModelService } from './model/model.service';
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
  ],
  providers: [ModelService],
  controllers: [ModelController],
})
export class AppModule {}
