import { Injectable } from '@nestjs/common';
import { systemQ } from '../utils/system-q-model';

@Injectable()
export class ModelService {
  calcualteMarksBySystemQ = (
    peerRating: (number | null)[][],
    groupScore: number,
  ): number[] | undefined => {
    return systemQ(peerRating, groupScore);
  };
}
