import { Module } from '@nestjs/common';
import { CatsModule } from './cats/cats.module';
import { ModelController } from './model/model.controller';
import { ModelModule } from './model/model.module';
import { ModelService } from './model/model.service';
// import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  // imports: [CatsModule, ModelModule, AuthModule, UserModule],
  imports: [CatsModule, ModelModule, UserModule],
  providers: [ModelService],
  controllers: [ModelController],
})
export class AppModule {}
