import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CatsModule } from './cats/cats.module';
import { ModelController } from './model/model.controller';
import { ModelModule } from './model/model.module';
import { ModelService } from './model/model.service';
import { UserModule } from './user/user.module';

@Module({
  imports: [CatsModule, ModelModule, UserModule, AuthModule],
  providers: [ModelService],
  controllers: [ModelController],
})
export class AppModule {}
