export const webavalia = (
  peerRating: (number | null)[][],
  groupScore: number,
  saWeight: number,
  paWeight: number,
): number[] | null => {
  const groupSize = peerRating.length;

  if (groupSize !== peerRating[0].length) {
    console.log('Invalid peer rating matrix');
    return null;
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
      (saWeight * selfRating + paWeight * sumOtherRating) /
      (saWeight + paWeight * (groupSize - 1));
    tempScores.push(rating);
  });

  const maxScore = Math.max(...tempScores);
  const studentScores: number[] = [];

  tempScores.forEach((score) => {
    const finalScore = groupScore * Math.sqrt(score / maxScore);
    studentScores.push(finalScore);
  });

  return studentScores;
};
