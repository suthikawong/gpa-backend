import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { UserModule } from '../user/user.module';
import { ClassroomController } from './classroom.controller';
import { ClassroomService } from './classroom.service';

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
  ],
  controllers: [ClassroomController],
  providers: [ClassroomService],
})
export class ClassroomModule {}
