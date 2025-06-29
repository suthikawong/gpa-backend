import { Controller, Get } from '@nestjs/common';
import { AppResponse } from '../app.response';
import { ModelLookupResponse } from './dto/lookup.response';
import { LookupService } from './lookup.service';

@Controller('lookup')
export class LookupController {
  constructor(private lookupModelService: LookupService) {}

  @Get('model')
  async getModels(): Promise<AppResponse<ModelLookupResponse>> {
    const data = await this.lookupModelService.getModels();
    return { data };
  }
}
