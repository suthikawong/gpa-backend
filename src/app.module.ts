import { Module } from '@nestjs/common';
import { CatsModule } from './cats/cats.module';
import { ModelController } from './model/model.controller';
import { ModelModule } from './model/model.module';
import { ModelService } from './model/model.service';

@Module({
  imports: [CatsModule, ModelModule],
  providers: [ModelService],
  controllers: [ModelController],
})
export class AppModule {}
