import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';
import { AssignmentModule } from '../assignment/assignment.module';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AssignmentModule,
    UserModule,
  ],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
