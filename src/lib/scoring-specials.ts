import type {
  BonusPredictions,
  GroupCode,
  SpecialEventType,
  SpecialOutcomes,
  TournamentPicks,
} from './types';

export const SPECIAL_EVENT_LABELS: Record<SpecialEventType, string> = {
  group_stage_picks: 'Group Stage Picks',
  best_third_place: 'Best 3rd Place Teams',
  round_of_16_picks: 'Round of 16 Picks',
  quarter_final_picks: 'Quarter-Final Picks',
  semi_final_picks: 'Semi-Final Picks',
  finalist_picks: 'Finalist Picks',
  winner_pick: 'Tournament Winner',
  top_goalscorer: 'Top Goalscorer',
  group_stage_highest_scorers: 'Group Stage Highest Scorers',
  best_group_stage_defence: 'Best Group Stage Defence',
  yellow_cards: 'Yellow Cards',
  red_cards: 'Red Cards',
  penalty_shootouts: 'Penalty Shootouts',
};

const GROUP_CODES: GroupCode[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// 2 pts per correct winner, 10 bonus if all 12 correct.
// 2 pts per correct runner-up, 10 bonus if all 12 correct.
function scoreGroupStagePicks(picks: TournamentPicks, outcomes: SpecialOutcomes): number {
  if (!outcomes.groupResults) return 0;
  let winnerPts = 0;
  let runnerUpPts = 0;
  let allWinnersCorrect = true;
  let allRunnersUpCorrect = true;

  for (const group of GROUP_CODES) {
    const actual = outcomes.groupResults[group];
    const predicted = picks.groups[group];
    if (!actual || !predicted) {
      allWinnersCorrect = false;
      allRunnersUpCorrect = false;
      continue;
    }
    if (predicted.winner === actual.winner) {
      winnerPts += 2;
    } else {
      allWinnersCorrect = false;
    }
    if (predicted.runnerUp === actual.runnerUp) {
      runnerUpPts += 2;
    } else {
      allRunnersUpCorrect = false;
    }
  }

  return winnerPts + (allWinnersCorrect ? 10 : 0) + runnerUpPts + (allRunnersUpCorrect ? 10 : 0);
}

// 5 pts per correct 3rd-place qualifier, 10 bonus if all 8 correct.
function scoreBestThirdPlace(picks: TournamentPicks, outcomes: SpecialOutcomes): number {
  if (!outcomes.bestThirdPlace?.length) return 0;
  const actualSet = new Set(outcomes.bestThirdPlace);
  let pts = 0;
  let allCorrect = true;

  for (const team of picks.bestThirdPlace) {
    if (actualSet.has(team)) {
      pts += 5;
    } else {
      allCorrect = false;
    }
  }
  if (picks.bestThirdPlace.length < 8) allCorrect = false;

  return pts + (allCorrect ? 10 : 0);
}

// Generic: 5 pts per correct team in set, 10 bonus if all correct.
function scoreTeamSet(playerTeams: string[], actualTeams: string[]): number {
  if (!actualTeams.length) return 0;
  const actualSet = new Set(actualTeams);
  let pts = 0;
  let allCorrect = true;

  for (const team of playerTeams) {
    if (actualSet.has(team)) {
      pts += 5;
    } else {
      allCorrect = false;
    }
  }
  if (playerTeams.length < actualTeams.length) allCorrect = false;

  return pts + (allCorrect ? 10 : 0);
}

// 20 pts for correct winner.
function scoreWinner(picks: TournamentPicks, outcomes: SpecialOutcomes): number {
  if (!outcomes.winner) return 0;
  return picks.winner === outcomes.winner ? 20 : 0;
}

// 3 pts per goal scored by predicted player, 10 bonus if tournament top goalscorer.
function scoreTopGoalscorer(bonus: BonusPredictions, outcomes: SpecialOutcomes): number {
  const goals = outcomes.topScorerGoalsMap?.[bonus.topScorer] ?? 0;
  const pts = goals * 3;
  const bonus10 = outcomes.actualTopScorer === bonus.topScorer ? 10 : 0;
  return pts + bonus10;
}

// 1 pt per goal scored by predicted team in group stage, 10 bonus if correct team.
function scoreHighestScorers(bonus: BonusPredictions, outcomes: SpecialOutcomes): number {
  const goals =
    outcomes.highestScoringTeamGoalsMap?.[bonus.highestScoringTeam] ??
    outcomes.highestScoringTeamGoals ??
    0;
  const pts = goals;
  const bonus10 = outcomes.highestScoringTeam === bonus.highestScoringTeam ? 10 : 0;
  return pts + bonus10;
}

// -1 pt per goal conceded by predicted team in group stage, 10 bonus if correct team.
function scoreBestDefence(bonus: BonusPredictions, outcomes: SpecialOutcomes): number {
  const conceded =
    outcomes.bestDefenceGoalsConcededMap?.[bonus.bestDefence] ??
    outcomes.bestDefenceGoalsConceded ??
    0;
  const pts = conceded * -1;
  const bonus10 = outcomes.bestDefenceTeam === bonus.bestDefence ? 10 : 0;
  return pts + bonus10;
}

// Exact: 20 pts, within 10: 10 pts.
function scoreYellowCards(bonus: BonusPredictions, outcomes: SpecialOutcomes): number {
  if (outcomes.totalYellowCards === undefined) return 0;
  const diff = Math.abs(bonus.totalYellowCards - outcomes.totalYellowCards);
  if (diff === 0) return 20;
  if (diff <= 10) return 10;
  return 0;
}

// Exact: 15 pts, within 1: 10 pts.
function scoreRedCards(bonus: BonusPredictions, outcomes: SpecialOutcomes): number {
  if (outcomes.totalRedCards === undefined) return 0;
  const diff = Math.abs(bonus.totalRedCards - outcomes.totalRedCards);
  if (diff === 0) return 15;
  if (diff <= 1) return 10;
  return 0;
}

// Exact: 10 pts, within 1: 5 pts.
function scorePenaltyShootouts(bonus: BonusPredictions, outcomes: SpecialOutcomes): number {
  if (outcomes.penaltyShootouts === undefined) return 0;
  const diff = Math.abs(bonus.penaltyShootouts - outcomes.penaltyShootouts);
  if (diff === 0) return 10;
  if (diff <= 1) return 5;
  return 0;
}

export function scoreSpecialEvent(
  type: SpecialEventType,
  picks: TournamentPicks | null,
  bonus: BonusPredictions | null,
  outcomes: SpecialOutcomes,
): number {
  switch (type) {
    case 'group_stage_picks':
      return picks ? scoreGroupStagePicks(picks, outcomes) : 0;
    case 'best_third_place':
      return picks ? scoreBestThirdPlace(picks, outcomes) : 0;
    case 'round_of_16_picks':
      return picks && outcomes.roundOf16
        ? scoreTeamSet(picks.roundOf16, outcomes.roundOf16)
        : 0;
    case 'quarter_final_picks':
      return picks && outcomes.quarterFinalists
        ? scoreTeamSet(picks.quarterFinalists, outcomes.quarterFinalists)
        : 0;
    case 'semi_final_picks':
      return picks && outcomes.semiFinalists
        ? scoreTeamSet(picks.semiFinalists, outcomes.semiFinalists)
        : 0;
    case 'finalist_picks':
      return picks && outcomes.finalists
        ? scoreTeamSet(picks.finalists, outcomes.finalists)
        : 0;
    case 'winner_pick':
      return picks ? scoreWinner(picks, outcomes) : 0;
    case 'top_goalscorer':
      return bonus ? scoreTopGoalscorer(bonus, outcomes) : 0;
    case 'group_stage_highest_scorers':
      return bonus ? scoreHighestScorers(bonus, outcomes) : 0;
    case 'best_group_stage_defence':
      return bonus ? scoreBestDefence(bonus, outcomes) : 0;
    case 'yellow_cards':
      return bonus ? scoreYellowCards(bonus, outcomes) : 0;
    case 'red_cards':
      return bonus ? scoreRedCards(bonus, outcomes) : 0;
    case 'penalty_shootouts':
      return bonus ? scorePenaltyShootouts(bonus, outcomes) : 0;
  }
}
