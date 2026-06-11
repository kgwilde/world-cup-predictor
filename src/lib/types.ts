// ─── Match / Fixture ────────────────────────────────────────────────────────

export type FixtureStage =
  | 'group'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarter_final'
  | 'semi_final'
  | 'third_place'
  | 'final';

export type MatchStatus = 'upcoming' | 'live' | 'final';

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
