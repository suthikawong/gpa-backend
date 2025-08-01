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

export interface CalcualteScoresByWebavaliaResponse {
  mean: {
    score: string;
  };
  studentGrades: {
    student: number;
    score: string;
  }[];
}
