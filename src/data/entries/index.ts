import type { BonusPredictions, Prediction, TournamentPicks } from '@/lib/types';

import * as p1 from './player1';
import * as p2 from './player2';
import * as p3 from './player3';
import * as p4 from './player4';
import * as p5 from './player5';
import * as p6 from './player6';

const players = [p1, p2, p3, p4, p5, p6];

export const allPredictions: Prediction[] = players.flatMap((p) => p.predictions);
export const allTournamentPicks: TournamentPicks[] = players.map((p) => p.tournamentPicks);
export const allBonusPredictions: BonusPredictions[] = players.map((p) => p.bonusPredictions);
