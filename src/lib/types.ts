// ─── Match / Fixture ────────────────────────────────────────────────────────

export type FixtureStage =
  | 'group'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarter_final'
  | 'semi_final'
  | 'third_place'
  | 'final';

export type MatchStatus = 'upcoming' | 'live' | 'half_time' | 'final';

export function isInProgress(status?: MatchStatus): boolean {
  return status === 'live' || status === 'half_time';
}

export interface Team {
  code: string;
  name: string;
  accentColor: string; // Hexcode string of the team's accent color, e.g. "#FF0000"
}

export interface Fixture {
  id: string;
  stage: FixtureStage;
  group?: string;
  matchday?: number;
  homeTeam: Team;
  awayTeam: Team;
  kickoff: string; // UTC Z denotion
  venue: string;
}

// ─── Match Result ────────────────────────────────────────────────────────────

export interface MatchResult {
  fixtureId: string;
  homeGoals: number;
  awayGoals: number;
  status?: MatchStatus;
  minute?: number;
  injuryTime?: number;
}

export interface Player {
  id: string;
  name: string;
  teamName?: string;
  photoUrl?: string;
}

export interface Prediction {
  playerId: string;
  fixtureId: string;
  homeGoals: number;
  awayGoals: number;
  multiChip?: boolean;
}

export interface MatchPoints {
  playerId: string;
  fixtureId: string;
  points: number;
  resultCorrect: boolean;
  homeGoalsCorrect: boolean;
  awayGoalsCorrect: boolean;
  multiChipApplied: boolean;
}

export interface PlayerStanding {
  player: Player;
  totalPoints: number;
  rank: number;
  matchPoints: MatchPoints[];
  specialPoints: Array<{ eventId: SpecialEventType; eventLabel: string; points: number }>;
  previousRank?: number;
}

// ─── Auth / User Profile ─────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  avatarUpdatedAt: string | null;
  teamName: string | null;
  predictionFileUrl: string | null;
  predictionFileName: string | null;
  predictionUploadedAt: string | null;
  approved: boolean;
  multiChips?: string[];
}

// Safe subset returned by getAllUsers() — email is never sent to the client for other users
export type PublicProfile = Omit<UserProfile, 'email'>;

// ─── Multi-chip ───────────────────────────────────────────────────────────────

export interface MultiChip {
  playerId: string;
  fixtureId: string;
}

// ─── Special Events ───────────────────────────────────────────────────────────

export type SpecialEventType =
  | 'group_stage_picks'
  | 'best_third_place'
  | 'round_of_16_picks'
  | 'quarter_final_picks'
  | 'semi_final_picks'
  | 'finalist_picks'
  | 'winner_pick'
  | 'top_goalscorer'
  | 'group_stage_highest_scorers'
  | 'best_group_stage_defence'
  | 'yellow_cards'
  | 'red_cards'
  | 'penalty_shootouts';

export interface SpecialEvent {
  id: SpecialEventType;
  label: string;
  appliedAt: string; // ISO timestamp — controls replay ordering
  playerPoints: Record<string, number>; // playerId → pts awarded
}

export interface SpecialOutcomes {
  groupResults?: Record<GroupCode, GroupPicks>;
  bestThirdPlace?: string[];
  roundOf16?: string[];
  quarterFinalists?: string[];
  semiFinalists?: string[];
  finalists?: string[];
  winner?: string;
  highestScoringTeam?: string;
  highestScoringTeamGoals?: number;
  bestDefenceTeam?: string;
  bestDefenceGoalsConceded?: number;
  totalYellowCards?: number;
  totalRedCards?: number;
  penaltyShootouts?: number;
  topScorerGoalsMap?: Record<string, number>; // player name → goals scored
  actualTopScorer?: string;
}

// ─── Specials Predictions ────────────────────────────────────────────────────

export type GroupCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

export interface GroupPicks {
  winner: string;   // team code
  runnerUp: string; // team code
}

export interface TournamentPicks {
  playerId: string;
  groups: Record<GroupCode, GroupPicks>;
  bestThirdPlace: string[];   // 8 team codes
  roundOf16: string[];        // 16 team codes
  quarterFinalists: string[]; // 8 team codes
  semiFinalists: string[];    // 4 team codes
  finalists: string[];        // 2 team codes
  winner: string;
}

export interface BonusPredictions {
  playerId: string;
  topScorer: string;
  highestScoringTeam: string; // team code
  bestDefence: string;        // team code
  totalYellowCards: number;
  totalRedCards: number;
  penaltyShootouts: number;
}
