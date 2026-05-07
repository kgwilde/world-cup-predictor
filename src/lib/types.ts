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
}

export interface MatchPoints {
  playerId: string;
  fixtureId: string;
  points: number;
  resultCorrect: boolean;
  homeGoalsCorrect: boolean;
  awayGoalsCorrect: boolean;
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
  predictionUploadedAt: string | null;
  approved: boolean;
}
