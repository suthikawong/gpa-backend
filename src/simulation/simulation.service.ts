import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import {
  calculateStudentsScoresFromSpecificComponentByQASS,
  QASSMode,
} from '../utils/qass.model';
import { webavalia } from '../utils/webavalia-model';
import { CalcualteScoresByQASSResponse } from './dto/simulation.response';
import { CalcualteScoresByQASSRequest } from './dto/simulation.request';

@Injectable()
export class SimulationService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  calcualteScoresByQASS = ({
    peerMatrix,
    mode,
    groupProductScore,
    peerRatingImpact,
    groupSpread,
    tuningFactor,
    peerRatingWeights,
  }: CalcualteScoresByQASSRequest): CalcualteScoresByQASSResponse => {
    const groupSize = peerMatrix.length;

    const {
      studentRatings,
      meanStudentRating,
      studentContributions,
      meanStudentContribution,
      studentScores,
      meanStudentScore,
    } = calculateStudentsScoresFromSpecificComponentByQASS(
      peerMatrix,
      mode,
      groupProductScore,
      peerRatingImpact,
      groupSpread,
      tuningFactor,
      peerRatingWeights,
    );

    const result: {
      student: number;
      score: string;
      rating: string;
      contribution: string;
    }[] = [];

    for (let i = 0; i < groupSize; i++) {
      result.push({
        student: i + 1,
        score: studentScores[i].toFixed(3),
        rating: studentRatings[i].toFixed(3),
        contribution: studentContributions[i].toFixed(3),
      });
    }

    return {
      mean: {
        score: meanStudentScore.toFixed(3),
        rating: meanStudentRating.toFixed(3),
        contribution: meanStudentContribution.toFixed(3),
      },
      studentScores: result,
    };
  };

  calcualteScoresByWebavalia = (
    peerRating: (number | null)[][],
    groupScore: number,
    saWeight: number,
    paWeight: number,
  ): number[] | null => {
    return webavalia(peerRating, groupScore, saWeight, paWeight);
  };
}
