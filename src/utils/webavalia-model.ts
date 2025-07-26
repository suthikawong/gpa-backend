export const calculateStudentsScoresFromSpecificComponentByWebavalia = ({
  peerMatrix,
  groupProductScore,
  selfWeight,
}: {
  peerMatrix: (number | undefined)[][];
  groupProductScore: number;
  selfWeight: number;
}) => {
  const groupSize = peerMatrix.length;

  if (groupSize !== peerMatrix[0].length) {
    throw new Error('Invalid peer rating matrix');
  }

  const peerWeight = (1 - selfWeight) / (groupSize - 1);

  const tempScores: number[] = [];

  peerMatrix.forEach((scores, currStudent) => {
    let selfRating = 0;
    let sumOtherRating = 0;
    scores.forEach((score, i) => {
      if (currStudent === i) {
        selfRating = score ?? 0;
      } else {
        sumOtherRating += score ?? 0;
      }
    });
    const rating =
      (selfWeight * selfRating + peerWeight * sumOtherRating) /
      (selfWeight + peerWeight * (groupSize - 1));
    tempScores.push(rating);
  });

  const maxScore = Math.max(...tempScores);
  const studentScores: number[] = [];

  tempScores.forEach((score) => {
    const finalScore = groupProductScore * Math.sqrt(score / maxScore);
    studentScores.push(finalScore);
  });

  return {
    studentScores,
    meanStudentScore:
      studentScores.reduce((prev, curr) => prev + curr, 0) / groupSize,
  };
};

export const calculateStudentsScoresFromAllComponentsByWebavalia = ({
  peerMatrix,
  groupProductScore,
  selfWeight,
  scoringComponentWeights,
}: {
  peerMatrix: (number | undefined)[][][];
  groupProductScore: number;
  selfWeight: number;
  scoringComponentWeights: number[];
}) => {
  const scoringComponentSize = scoringComponentWeights.length;

  if (scoringComponentSize !== peerMatrix.length) {
    throw new Error(
      'scoring component weights do not match with peer rating matrix',
    );
  }

  scoringComponentSize;
  const sumWeightedStudentScores: number[] =
    Array(scoringComponentSize).fill(0);
  // let sumMeanStudentScore = 0;
  const sumWeight = scoringComponentWeights.reduce(
    (prev, curr) => prev + curr,
    0,
  );

  for (let i = 0; i < scoringComponentSize; i++) {
    const { studentScores } =
      calculateStudentsScoresFromSpecificComponentByWebavalia({
        peerMatrix: peerMatrix[i],
        groupProductScore: groupProductScore!,
        selfWeight,
      });
    for (let j = 0; j < studentScores.length; j++) {
      sumWeightedStudentScores[i] +=
        studentScores[i] * scoringComponentWeights[i];
    }
    // sumMeanStudentScore += meanStudentScore * scoringComponentWeights[i];
  }

  const finalStudentScores = sumWeightedStudentScores.map(
    (item) => item / sumWeight,
  );
  // const finalMeanStudentScore = sumMeanStudentScore / sumWeight;

  return finalStudentScores;
};
