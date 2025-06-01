import { Controller, Get } from '@nestjs/common';
import { AppResponse } from '../app.response';
import { GetInstitutesResponse } from './dto/lookup.response';
import { LookupService } from './lookup.service';

@Controller('lookup')
export class LookupController {
  constructor(private readonly lookupService: LookupService) {}

  @Get('institutes')
  async getInstitutes(): Promise<AppResponse<GetInstitutesResponse>> {
    const group = await this.lookupService.getInstitutes();
    return { data: group };
  }
}
