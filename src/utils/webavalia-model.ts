export const webavalia = (
  peerRating: (number | undefined)[][],
  groupScore: number,
  selfWeight: number,
  peerWeight: number,
) => {
  const groupSize = peerRating.length;

  if (groupSize !== peerRating[0].length) {
    throw new Error('Invalid peer rating matrix');
  }

  const tempScores: number[] = [];

  peerRating.forEach((scores, currStudent) => {
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
    const finalScore = groupScore * Math.sqrt(score / maxScore);
    studentScores.push(finalScore);
  });

  return {
    studentScores,
    meanStudentScore:
      studentScores.reduce((prev, curr) => prev + curr, 0) / groupSize,
  };
};
