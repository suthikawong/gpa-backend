export enum QASSMode {
  B = 'B',
  C = 'C',
  D = 'D',
}

const fillEmptyRatingsWithUnconstraint = (
  peerMatrix: (number | undefined | null)[][],
  polishingFactor: number,
  lowerBound: number,
  upperBound: number,
) => {
  const neutral = (upperBound - lowerBound) / 2 + lowerBound;
  return peerMatrix.map((row, i) =>
    row.map((col, j) => {
      if (typeof col === 'number') return col;
      if (i === j) return polishingFactor;
      return neutral;
    }),
  );
};

const fillEmptyRating = (
  peerMatrix: (number | undefined | null)[][],
  polishingFactor: number,
  isTotalScoreConstrained: boolean,
  lowerBound: number,
  upperBound: number,
): number[][] => {
  if (isTotalScoreConstrained) {
    return fillEmptyRatingsWithUnconstraint(
      peerMatrix,
      polishingFactor,
      lowerBound,
      upperBound,
    );
  } else {
    return fillEmptyRatingsWithUnconstraint(
      peerMatrix,
      polishingFactor,
      lowerBound,
      upperBound,
    );
  }
};

// calculate student scores in a specific scoring component
// the result will be student scores in a group
export const calculateStudentsScoresFromSpecificComponentByQASS = (
  peerMatrix: (number | undefined | null)[][],
  mode: QASSMode,
  groupProductScore: number,
  peerRatingImpact: number,
  groupSpread: number,
  polishingFactor: number,
  peerRatingWeights: number[],
  isTotalScoreConstrained: boolean,
  lowerBound: number,
  upperBound: number,
) => {
  const groupSize = peerMatrix.length;

  if (groupSize !== peerMatrix[0].length) {
    throw new Error('Invalid peer rating matrix');
  }
  if (peerRatingWeights.length !== peerMatrix[0].length) {
    throw new Error('Peer rating weights do not match with peer rating matrix');
  }

  const isOutOfBound = peerMatrix.some((row) =>
    row.some(
      (col) =>
        typeof col === 'number' && (col > upperBound || col < lowerBound),
    ),
  );

  if (isOutOfBound) {
    throw new Error('Some peer rating are out of bound');
  }

  const standardizedPeerRating = peerMatrix.map((row) =>
    row.map((col) =>
      typeof col === 'number'
        ? (col - lowerBound) / (upperBound - lowerBound)
        : null,
    ),
  );

  const noEmptyPeerRating = fillEmptyRating(
    standardizedPeerRating,
    polishingFactor,
    isTotalScoreConstrained,
    lowerBound,
    upperBound,
  );

  const { studentRatings, meanStudentRating } = caluclateRatings(
    polishingFactor,
    noEmptyPeerRating,
    peerRatingWeights,
    mode,
  );

  const studentContributions: number[] = [];
  const contributionValues: number[] = [];

  studentRatings.forEach((rating) => {
    const { studentContribution, contributionValue } =
      caluclateComponentStudentContributions(
        rating,
        meanStudentRating,
        peerRatingImpact,
        mode,
      );
    studentContributions.push(studentContribution);
    contributionValues.push(contributionValue);
  });

  const studentScores = calculateStudentScores(
    studentContributions,
    groupProductScore,
    groupSpread,
  );

  const meanStudentContribution = calculateMeanStudentContribution(
    studentContributions,
    peerRatingWeights,
  );

  const meanStudentScore = calculateMeanStudentScore(
    groupProductScore,
    groupSpread,
    meanStudentContribution,
  );

  // validate scores
  // SplitJoinInvariance(
  //   meanStudentScore,
  //   groupProductScore,
  //   meanStudentContribution,
  //   groupSpread,
  // );

  return {
    studentRatings,
    meanStudentRating,
    studentContributions,
    meanStudentContribution,
    studentScores,
    meanStudentScore,
  };
};

export const calculateStudentsScoresFromAllComponentsByQASS = ({
  peerMatrix,
  mode,
  groupProductScore,
  peerRatingImpact,
  groupSpread,
  polishingFactor,
  peerRatingWeights,
  scoringComponentWeights,
  isTotalScoreConstrained,
  lowerBound,
  upperBound,
}: {
  peerMatrix: (number | undefined)[][][];
  mode: QASSMode;
  groupProductScore: number;
  peerRatingImpact: number;
  groupSpread: number;
  polishingFactor: number;
  peerRatingWeights: number[];
  scoringComponentWeights: number[];
  isTotalScoreConstrained: boolean;
  lowerBound: number;
  upperBound: number;
}) => {
  const scoringComponentSize = scoringComponentWeights.length;

  if (scoringComponentWeights.length !== peerMatrix.length) {
    throw new Error(
      'scoring component weights do not match with peer rating matrix',
    );
  }

  const studentContributionsFromAllComponents: number[][] =
    peerRatingWeights.map(() => []);

  for (let k = 0; k < scoringComponentSize; k++) {
    const { studentContributions } =
      calculateStudentsScoresFromSpecificComponentByQASS(
        peerMatrix[k],
        mode,
        groupProductScore,
        peerRatingImpact,
        groupSpread,
        polishingFactor,
        peerRatingWeights,
        isTotalScoreConstrained,
        lowerBound,
        upperBound,
      );
    studentContributions.forEach((cont, i) => {
      studentContributionsFromAllComponents[i].push(cont);
    });
  }

  const studentScores: number[] = [];

  studentContributionsFromAllComponents.forEach(
    (studentContributionsInComponent) => {
      const totalStudentContributions = calculateStudentContribution(
        studentContributionsInComponent,
        scoringComponentWeights,
      );
      const score = Math.pow(
        groupProductScore,
        Math.pow(groupSpread, totalStudentContributions),
      );
      studentScores.push(score);
    },
  );

  return studentScores;
};

const calculateRescaledPeerRating = (
  polishingFactor: number,
  rating: number,
) => {
  return (1 - polishingFactor) * rating + polishingFactor * (1 - rating);
};

const caluclateRatings = (
  polishingFactor: number,
  peerMatrix: number[][],
  peerRatingWeights: number[],
  mode: QASSMode,
) => {
  const groupSize = peerMatrix.length;
  const studentRatings: number[] = [];
  //

  const formulas = {
    [QASSMode.B]: {
      'R2-1': (peerRating: number, selfRating: number, weight: number) => {
        return Math.pow(
          (peerRating / (1 - peerRating)) * ((1 - selfRating) / selfRating),
          weight,
        );
      },
      'R2-2': (value: number) => value / (1 + value),
      'R3-1': (value: number, weight: number) => Math.pow(value, weight),
      'R3-2': (value: number) => value / (1 + value),
    },
    [QASSMode.C]: {
      'R2-1': (peerRating: number, selfRating: number, weight: number) => {
        return Math.pow(
          (peerRating / (2 - peerRating)) * ((2 - selfRating) / selfRating),
          weight,
        );
      },
      'R2-2': (value: number) => (2 * value) / (1 + value),
      'R3-1': (value: number, weight: number) => Math.pow(value, weight),
      'R3-2': (value: number) => (2 * value) / (1 + value),
    },
    [QASSMode.D]: {
      'R2-1': (peerRating: number, selfRating: number, weight: number) => {
        return Math.pow(
          ((1 + peerRating) / (1 - peerRating)) *
            ((1 - selfRating) / (1 + selfRating)),
          weight,
        );
      },
      'R2-2': (value: number) => (value - 1) / (value + 1),
      'R3-1': (value: number, weight: number) => Math.pow(value, weight),
      'R3-2': (value: number) => (value - 1) / (value + 1),
    },
  };

  let iSum = 1;
  for (let i = 0; i < groupSize; i++) {
    let jSum = 1;
    for (let j = 0; j < groupSize; j++) {
      const peerRating = calculateRescaledPeerRating(
        polishingFactor,
        peerMatrix[i][j],
      ); // Step 1
      const selfRating = calculateRescaledPeerRating(
        polishingFactor,
        peerMatrix[j][j],
      );
      jSum *= formulas[mode]['R2-1'](
        peerRating,
        selfRating,
        peerRatingWeights[j],
      );
    }
    studentRatings.push(formulas[mode]['R2-2'](jSum)); // Step 2
    iSum *= formulas[mode]['R3-1'](jSum, peerRatingWeights[i]);
  }
  const meanStudentRating = formulas[mode]['R3-2'](iSum); // Step 3
  return { studentRatings, meanStudentRating };
};

const caluclateComponentStudentContributions = (
  studentRating: number,
  meanStudentRating: number,
  impact: number,
  mode: QASSMode,
) => {
  const formulas = {
    [QASSMode.B]: {
      'C1-1': (
        studentRating: number,
        meanStudentRating: number,
        impact: number,
      ) =>
        Math.pow(studentRating / (1 - studentRating), impact) /
        Math.pow(meanStudentRating / (1 - meanStudentRating), impact),
      'C1-2': (value: number) => (value - 1) / (value + 1),
    },
    [QASSMode.C]: {
      'C1-1': (
        studentRating: number,
        meanStudentRating: number,
        impact: number,
      ) =>
        Math.pow(studentRating / (2 - studentRating), impact) /
        Math.pow(meanStudentRating / (2 - meanStudentRating), impact),
      'C1-2': (value: number) => (value - 1) / (value + 1),
    },
    [QASSMode.D]: {
      'C1-1': (
        studentRating: number,
        meanStudentRating: number,
        impact: number,
      ) =>
        Math.pow((1 + studentRating) / (1 - studentRating), impact) /
        Math.pow((1 + meanStudentRating) / (1 - meanStudentRating), impact),
      'C1-2': (value: number) => (value - 1) / (value + 1),
    },
  };

  const contributionValue = formulas[mode]['C1-1'](
    studentRating,
    meanStudentRating,
    impact,
  );
  const studentContribution = formulas[mode]['C1-2'](contributionValue);
  return { studentContribution, contributionValue };
};

const calculateStudentContribution = (
  studentContributions: number[], // student contribution of a specific student from multiple scoring components
  scoringComponentWeights: number[],
) => {
  let sum = 1;
  scoringComponentWeights.forEach((weight, k) => {
    sum *= Math.pow(
      (1 + studentContributions[k]) / (1 - studentContributions[k]),
      weight,
    );
  });
  return (sum - 1) / (sum + 1);
};
const calculateMeanStudentContribution = (
  studentContributions: number[],
  peerRatingWeights: number[],
) => {
  let sum = 1;
  peerRatingWeights.forEach((weight, i) => {
    sum *= Math.pow(
      (1 + studentContributions[i]) / (1 - studentContributions[i]),
      weight,
    );
  });
  return (sum - 1) / (sum + 1);
};

const calculateStudentScores = (
  studentContributions: number[],
  groupProductScore: number,
  groupSpread: number,
) => {
  const studentScores: number[] = [];
  studentContributions.forEach((cont) => {
    const studentScore = Math.pow(
      groupProductScore,
      Math.pow(groupSpread, cont),
    );
    studentScores.push(studentScore);
  });
  return studentScores;
};

const calculateMeanStudentScore = (
  groupProductScore: number,
  groupSpread: number,
  meanStudentContribution: number,
) => {
  return Math.pow(
    groupProductScore,
    Math.pow(groupSpread, meanStudentContribution),
  );
};

// validate scores with Split-Join-Invariance
// const SplitJoinInvariance = (
//   meanScore: number,
//   groupProductScore: number,
//   meanStudentContribution: number,
//   groupSpread: number,
// ) => {
//   console.log('meanScore : ', meanScore);
//   console.log(
//     'pow : ',
//     Math.pow(groupProductScore, Math.pow(groupSpread, meanStudentContribution)),
//   );
//   if (
//     meanScore !==
//     Math.pow(groupProductScore, Math.pow(groupSpread, meanStudentContribution))
//   ) {
//     throw new Error('Fail Split-Join-Invariance validation');
//   }
// };
