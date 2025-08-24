import { Injectable } from '@nestjs/common';
import { calculateStudentsScoresFromSpecificComponentByQASS } from '../utils/qass.model';
import { calculateStudentGradesFromSpecificComponentByWebavalia } from '../utils/webavalia-model';
import {
  CalcualteScoresByQASSRequest,
  CalcualteScoresByWebavaliaRequest,
} from './dto/simulation.request';
import {
  CalcualteScoresByQASSResponse,
  CalcualteScoresByWebavaliaResponse,
} from './dto/simulation.response';

@Injectable()
export class SimulationService {
  calcualteScoresByQASS = ({
    peerMatrix,
    mode,
    groupProductScore,
    peerRatingImpact,
    groupSpread,
    polishingFactor,
    peerRatingWeights,
    lowerBound,
    upperBound,
  }: CalcualteScoresByQASSRequest): CalcualteScoresByQASSResponse => {
    const groupSize = peerMatrix.length;
    const sumWeights = peerRatingWeights.reduce((prev, curr) => prev + curr, 0);
    const weights = peerRatingWeights.map((w) => w / sumWeights);

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
      polishingFactor,
      weights,
      lowerBound,
      upperBound,
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
        score: studentScores[i].toFixed(2),
        rating: studentRatings[i].toFixed(2),
        contribution: studentContributions[i].toFixed(2),
      });
    }

    return {
      mean: {
        score: meanStudentScore.toFixed(2),
        rating: meanStudentRating.toFixed(2),
        contribution:
          meanStudentContribution.toFixed(2) === '-0.00'
            ? '0.00'
            : meanStudentContribution.toFixed(2),
      },
      studentScores: result,
    };
  };

  calcualteScoresByWebavalia = ({
    peerMatrix,
    groupGrade,
    selfWeight,
  }: CalcualteScoresByWebavaliaRequest): CalcualteScoresByWebavaliaResponse => {
    const { studentGrades, meanStudentGrade } =
      calculateStudentGradesFromSpecificComponentByWebavalia({
        peerMatrix,
        groupGrade,
        selfWeight,
      });
    return {
      studentGrades: studentGrades?.map((score, i) => ({
        student: i + 1,
        score: score.toString(),
      })),
      mean: {
        score: meanStudentGrade.toString(),
      },
    };
  };
}
