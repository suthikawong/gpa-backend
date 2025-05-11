export const systemQ = (
  peerRating: (number | null)[][],
  groupScore: number,
): number[] | null => {
  const groupSize = peerRating.length;
  const impact = 1;
  const tolerance = 2;

  if (groupSize !== peerRating[0].length) {
    console.log('Invalid peer rating matrix');
    return null;
  }

  const studentRatingList: number[] = [];

  for (let i = 0; i < groupSize; i++) {
    const studentRating = getStudentRating(i, peerRating, groupScore);
    // console.log(`Student Rating ${i + 1}: ${studentRating}`)
    studentRatingList.push(studentRating);
  }

  const studentRatingMean = getGroupRating(groupSize, studentRatingList);

  const finalScores: number[] = [];

  for (let i = 0; i < groupSize; i++) {
    const studentContribution = getStudentContribution(
      impact,
      studentRatingList[i],
      studentRatingMean,
    );
    const studentScore = getStudentScore(
      groupScore,
      tolerance,
      studentContribution,
    );
    finalScores.push(studentScore);
  }
  return finalScores;
};

const getStudentRating = (
  currStudent: number,
  peerRating: (number | null)[][],
  groupScore: number,
) => {
  const groupSize = peerRating.length;
  const containRatingIndex: number[] = [];

  for (let i = 0; i < groupSize; i++) {
    const allNull = peerRating[0].every((rating) => rating === null);
    if (!allNull) containRatingIndex.push(i);
  }

  // no ratings
  if (containRatingIndex.length === 0) {
    return groupScore;
  }
  // the current student has at least one rating
  else if (containRatingIndex.includes(currStudent)) {
    let sr = 1;
    for (let j = 0; j < groupSize; j++) {
      if (currStudent !== j && peerRating[currStudent][j] !== null) {
        const rating = Math.max(
          0.001,
          Math.min(peerRating[currStudent][j]! / 5, 0.999),
        );
        sr = sr * (rating / (1 - rating));
      }
    }
    sr = Math.pow(
      sr,
      1 / peerRating[currStudent].filter((item) => item !== null).length,
    );
    return sr / (1 + sr);
  }
  // the current student doesn't have rating but another students have
  else {
    let gr = 1;
    for (let i = 0; i < groupSize; i++) {
      if (containRatingIndex.includes(i)) {
        let sr = 1;
        for (let j = 0; j < groupSize; j++) {
          if (i !== j && peerRating[i][j] !== null) {
            const rating = Math.max(
              0.001,
              Math.min(peerRating[i][j]! / 5, 0.999),
            );
            sr = sr * (rating / (1 - sr));
          }
        }
        sr = Math.pow(
          sr,
          1 / peerRating[i].filter((item) => item !== null).length,
        );
        gr = gr * sr;
      }
    }
    gr = Math.pow(gr, 1 / containRatingIndex.length);
    return gr / (1 + gr);
  }
};

const getGroupRating = (groupSize: number, studentRatingList: number[]) => {
  let gr = 1;
  for (let j = 0; j < groupSize; j++) {
    const rating = Math.max(0.001, Math.min(studentRatingList[j], 0.999));
    gr = (gr * rating) / (1 - rating);
  }
  gr = Math.pow(gr, 1 / groupSize);
  return gr / (1 + gr);
};

const getStudentContribution = (
  impact: number,
  studentRating: number,
  studentRatingMean: number,
) => {
  const sc = Math.pow(
    (studentRating * (1 - studentRatingMean)) /
      ((1 - studentRating) * studentRatingMean),
    impact,
  );
  return (sc - 1) / (sc + 1);
};

const getStudentScore = (
  groupScore: number,
  tolerance: number,
  studentContribution: number,
) => {
  return Math.pow(groupScore, Math.pow(tolerance, -studentContribution));
};

// main

// const groupScore = 0.75
// const peerRating = [
//   [null, 1, 2, 2, 2],
//   [1, null, 3, 2, 4],
//   [3, 3, null, 5, 1],
//   [1, 1, 1, null, 4],
//   [1, 4, null, 2, null],
// ]

// systemQ(peerRating, groupScore)
