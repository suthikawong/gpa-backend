const fillEmptyVoting = (peerMatrix: (number | undefined | null)[][]) => {
  const groupSize = peerMatrix.length;
  return peerMatrix.map((row, i) =>
    row.map((col, j) => {
      if (typeof col === 'number') return col;
      if (i === j) return 0;
      return 20 / (groupSize - 1);
    }),
  );
};

export const calculateStudentGradesFromSpecificComponentByWebavalia = ({
  peerMatrix,
  groupGrade,
  selfWeight,
}: {
  peerMatrix: (number | undefined | null)[][];
  groupGrade: number;
  selfWeight: number;
}) => {
  const groupSize = peerMatrix.length;

  if (groupSize !== peerMatrix[0].length) {
    throw new Error('Invalid peer rating matrix');
  }

  const noEmptyPeerVoting = fillEmptyVoting(peerMatrix);

  const peerWeight = (1 - selfWeight) / (groupSize - 1);
  const tempGrades: number[] = [];
  const weightMatrix: number[][] = [];

  for (let i = 0; i < groupSize; i++) {
    weightMatrix.push([]);
    for (let j = 0; j < groupSize; j++) {
      if (i === j) weightMatrix[i].push(selfWeight);
      else weightMatrix[i].push(peerWeight);
    }
  }

  for (let i = 0; i < groupSize; i++) {
    let sum = 0;
    for (let j = 0; j < groupSize; j++) {
      sum += weightMatrix[i][j] * (noEmptyPeerVoting[i][j] ?? 0);
    }
    tempGrades.push(sum / 100);
  }

  const maxScore = Math.max(...tempGrades);
  const studentGrades: number[] = [];

  tempGrades.forEach((score) => {
    const studentGrade = (score / maxScore) * groupGrade;
    studentGrades.push(Math.round(studentGrade));
  });

  return {
    studentGrades,
    meanStudentGrade:
      studentGrades.reduce((prev, curr) => prev + curr, 0) / groupSize,
  };
};

export const calculateStudentGradesFromAllComponentsByWebavalia = ({
  peerMatrix,
  groupGrade,
  selfWeight,
  scoringComponentWeights,
}: {
  peerMatrix: (number | undefined)[][][];
  groupGrade: number;
  selfWeight: number;
  scoringComponentWeights: number[];
}) => {
  const scoringComponentSize = scoringComponentWeights.length;
  const groupSize = peerMatrix[0].length;

  if (scoringComponentSize !== peerMatrix.length) {
    throw new Error(
      'scoring component weights do not match with peer rating matrix',
    );
  }

  const finalStudentGrades: number[] = Array(groupSize).fill(0);
  const sumWeight = scoringComponentWeights.reduce(
    (prev, curr) => prev + curr,
    0,
  );
  const momentWeights = scoringComponentWeights.map((w) => w / sumWeight);

  for (let k = 0; k < scoringComponentSize; k++) {
    const { studentGrades } =
      calculateStudentGradesFromSpecificComponentByWebavalia({
        peerMatrix: peerMatrix[k],
        groupGrade: groupGrade!,
        selfWeight,
      });

    for (let i = 0; i < studentGrades.length; i++) {
      finalStudentGrades[i] += momentWeights[k] * studentGrades[i];
    }
  }

  return finalStudentGrades.map((grade) => Math.round(grade));
};
