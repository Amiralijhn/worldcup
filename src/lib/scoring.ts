function getWinner(team1Score: number, team2Score: number) {
  if (team1Score > team2Score) return "team1";
  if (team1Score < team2Score) return "team2";
  return "draw";
}

export function calculatePoints(
  predTeam1: number,
  predTeam2: number,
  actualTeam1: number,
  actualTeam2: number
) {
  if (predTeam1 === actualTeam1 && predTeam2 === actualTeam2) {
    return 5;
  }

  const predictionDifference = predTeam1 - predTeam2;
  const actualDifference = actualTeam1 - actualTeam2;

  if (predictionDifference === actualDifference) {
    return 3;
  }

  const predictionWinner = getWinner(predTeam1, predTeam2);
  const actualWinner = getWinner(actualTeam1, actualTeam2);

  if (predictionWinner === actualWinner) {
    return 2;
  }

  return 0;
}