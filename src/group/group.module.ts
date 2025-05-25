import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';

@Module({
  imports: [DrizzleModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupModule {}
