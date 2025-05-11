import { Injectable } from '@nestjs/common';
import { systemQ } from '../utils/system-q-model';
import { webavalia } from '../utils/webavalia-model';

@Injectable()
export class ModelService {
  calcualteMarksBySystemQ = (
    peerRating: (number | null)[][],
    groupScore: number,
  ): number[] | null => {
    return systemQ(peerRating, groupScore);
  };

  calcualteMarksByWebavalia = (
    peerRating: (number | null)[][],
    groupScore: number,
    saWeight: number,
    paWeight: number,
  ): number[] | null => {
    return webavalia(peerRating, groupScore, saWeight, paWeight);
  };
}
