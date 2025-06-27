export enum QASSMode {
  B = 'Bijunction',
  C = 'Conjunction',
  D = 'Disjunction',
}

// calculate student scores in a specific scoring component
// the result will be student scores in a group
export const calculateStudentsScoresFromSpecificComponentByQASS = (
  peerMatrix: number[][],
  groupProductScore: number,
  peerRatingImpact: number,
  groupSpread: number,
  tuningFactor: number,
  peerRatingWeights: number[],
  mode: QASSMode,
) => {
  const groupSize = peerMatrix.length;

  if (groupSize !== peerMatrix[0].length) {
    throw new Error('Invalid peer rating matrix');
  }
  if (peerRatingWeights.length !== peerMatrix[0].length) {
    throw new Error('Peer rating weights do not match with peer rating matrix');
  }

  const { studentRatings, meanStudentRating } = caluclateRatings(
    tuningFactor,
    peerMatrix,
    peerRatingWeights,
    QASSMode.B,
  );
  console.log('TLOG ~ meanStudentRating:', meanStudentRating);
  console.log('TLOG ~ studentRatings:', studentRatings);

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

  // validate scores
  const meanStudentContribution = calculateMeanStudentContribution(
    studentContributions,
    peerRatingWeights,
  );

  const meanStudentScore =
    studentScores.reduce((prev, curr) => prev + curr, 0) / studentScores.length;

  validateScores(
    meanStudentScore,
    groupProductScore,
    meanStudentContribution,
    groupSpread,
  );

  return { studentScores, studentContributions };
};

export const calculateStudentsScoresFromAllComponentsByQASS = (
  peerMatrix: number[][][],
  groupProductScore: number,
  peerRatingImpact: number,
  groupSpread: number,
  tuningFactor: number,
  peerRatingWeights: number[],
  scoringComponentWeights: number[],
  mode: QASSMode,
) => {
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
        groupProductScore,
        peerRatingImpact,
        groupSpread,
        tuningFactor,
        peerRatingWeights,
        mode,
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

const calculateRescaledPeerRating = (tuningFactor: number, rating: number) => {
  return (1 - tuningFactor) * rating + tuningFactor * (1 - rating);
};

const caluclateRatings = (
  tuningFactor: number,
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
        // console.log('TLOG ~ peerRating:', peerRating);
        // console.log('TLOG ~ selfRating:', selfRating);
        // console.log('TLOG ~ weight:', weight);

        return Math.pow(
          (peerRating / (1 - peerRating)) * ((1 - selfRating) / selfRating),
          weight,
        );
      },
      'R2-2': (value: number) => value / (1 + value),
      'R3-1': (value: number, weight: number) => Math.pow(value, weight),
      'R3-2': (value: number) => value / (1 + value),
    },
  };

  let iSum = 0;
  for (let i = 0; i < groupSize; i++) {
    let jSum = 0;
    for (let j = 0; j < groupSize; j++) {
      const peerRating = calculateRescaledPeerRating(
        tuningFactor,
        peerMatrix[i][j],
      ); // Step 1
      const selfRating = calculateRescaledPeerRating(
        tuningFactor,
        peerMatrix[j][j],
      );
      jSum += formulas[mode]['R2-1'](
        peerRating,
        selfRating,
        peerRatingWeights[j],
      );
    }
    studentRatings.push(formulas[mode]['R2-2'](jSum)); // Step 2
    iSum += formulas[mode]['R3-1'](jSum, peerRatingWeights[i]);
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
  };

  const contributionValue = formulas[mode]['C1-1'](
    studentRating,
    meanStudentRating,
    impact,
  );
  const studentContribution = formulas[mode]['C1-2'](contributionValue);
  console.log('TLOG ~ studentContribution:', studentContribution);
  return { studentContribution, contributionValue };
};

const calculateStudentContribution = (
  studentContributions: number[], // student contribution of a specific student from multiple scoring components
  scoringComponentWeights: number[],
) => {
  let sum = 0;
  scoringComponentWeights.forEach((weight, k) => {
    sum += Math.pow(
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
  let sum = 0;
  peerRatingWeights.forEach((weight, i) => {
    sum += Math.pow(
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

// validate scores with Split-Join-Invariance
const validateScores = (
  meanScore: number,
  groupProductScore: number,
  meanStudentContribution: number,
  groupSpread: number,
) => {
  // console.log(meanScore);
  // console.log(
  //   Math.pow(groupProductScore, Math.pow(groupSpread, meanStudentContribution)),
  // );
  if (
    meanScore !==
    Math.pow(groupProductScore, Math.pow(groupSpread, meanStudentContribution))
  ) {
    throw new Error('Fail Split-Join-Invariance validation');
  }
};
