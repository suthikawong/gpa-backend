export interface CalcualteScoresByQASSResponse {
  mean: {
    score: string;
    rating: string;
    contribution: string;
  };
  studentScores: {
    student: number;
    score: string;
    rating: string;
    contribution: string;
  }[];
}
