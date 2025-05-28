import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssignmentModule } from 'src/assignment/assignment.module';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AssignmentModule,
  ],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
