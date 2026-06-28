const knockoutStages = [
  "1/32",
  "1/16",
  "1/8",
  "1/4",
  "1/2 Final",
  "Playoff",
  "Final",
];

type Winner = "TEAM1" | "TEAM2" | "DRAW";

function getWinner(team1Score: number, team2Score: number): Winner {
  if (team1Score > team2Score) return "TEAM1";
  if (team1Score < team2Score) return "TEAM2";
  return "DRAW";
}

export function isKnockoutStage(stage: string) {
  return knockoutStages.includes(stage);
}

export function calculatePoints(
  predTeam1: number,
  predTeam2: number,
  actualTeam1: number,
  actualTeam2: number,
  stage = "Group Stage",
  predWinner?: string | null,
  actualWinner?: string | null
) {
  let points = 0;

  const predictedGoalDifference = predTeam1 - predTeam2;
  const actualGoalDifference = actualTeam1 - actualTeam2;

  const predictedScoreWinner = getWinner(predTeam1, predTeam2);
  const actualScoreWinner = getWinner(actualTeam1, actualTeam2);

  if (predTeam1 === actualTeam1 && predTeam2 === actualTeam2) {
    points += 5;
  } else if (predictedGoalDifference === actualGoalDifference) {
    points += 3;
  } else if (predictedScoreWinner === actualScoreWinner) {
    points += 2;
  }

  if (
    isKnockoutStage(stage) &&
    predWinner &&
    actualWinner &&
    predWinner === actualWinner
  ) {
    points += 2;
  }

  return points;
}