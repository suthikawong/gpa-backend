export interface CalcualteScoresByQASSResponse {
  mean: {
    score: number;
    rating: number;
    contribution: number;
  };
  studentScores: {
    student: number;
    score: number;
    rating: number;
    contribution: number;
  }[];
}
