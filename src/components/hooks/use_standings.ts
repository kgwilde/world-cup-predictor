import { useMemo } from 'react';

import { fixtures } from '@/data/fixtures';
import { calculateStandings } from '@/lib/scoring';
import type { Fixture, MatchResult, Player, PlayerStanding, Prediction, SpecialEvent } from '@/lib/types';

export type TimelineStep =
  | { kind: 'fixture'; fixture: Fixture }
  | { kind: 'special'; event: SpecialEvent };

export function buildTimeline(playedFixtures: Fixture[], specialEvents: SpecialEvent[]): TimelineStep[] {
  const fixtureSteps: TimelineStep[] = playedFixtures.map((f) => ({ kind: 'fixture', fixture: f }));
  const specialSteps: TimelineStep[] = specialEvents.map((e) => ({ kind: 'special', event: e }));
  return [...fixtureSteps, ...specialSteps].sort((a, b) => {
    const tA = a.kind === 'fixture' ? new Date(a.fixture.kickoff).getTime() : new Date(a.event.appliedAt).getTime();
    const tB = b.kind === 'fixture' ? new Date(b.fixture.kickoff).getTime() : new Date(b.event.appliedAt).getTime();
    return tA - tB;
  });
}

function sliceTimeline(timeline: TimelineStep[], upToIndex: number) {
  const steps = timeline.slice(0, upToIndex + 1);
  const fixtureSteps = steps.filter((s): s is Extract<TimelineStep, { kind: 'fixture' }> => s.kind === 'fixture');
  const specialEventsIncluded = steps
    .filter((s): s is Extract<TimelineStep, { kind: 'special' }> => s.kind === 'special')
    .map((s) => s.event);
  const upToFixtureId = fixtureSteps.length > 0 ? fixtureSteps[fixtureSteps.length - 1].fixture.id : undefined;
  return { upToFixtureId, specialEventsIncluded };
}

export function applySpecialPoints(
  standings: PlayerStanding[],
  specialEvents: SpecialEvent[],
): PlayerStanding[] {
  for (const standing of standings) {
    let specialTotal = 0;
    standing.specialPoints = specialEvents.map((event) => {
      const pts = event.playerPoints[standing.player.id] ?? 0;
      specialTotal += pts;
      return { eventId: event.id, eventLabel: event.label, points: pts };
    });
    standing.totalPoints += specialTotal;
  }

  standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return a.player.name.localeCompare(b.player.name);
  });
  standings.forEach((s, i) => {
    s.rank = i + 1;
  });

  return standings;
}

function standingsAt(
  players: Player[],
  predictions: Prediction[],
  results: MatchResult[],
  timeline: TimelineStep[],
  index: number,
): PlayerStanding[] {
  if (index === -1) return buildZeroStandings(players);
  const { upToFixtureId, specialEventsIncluded } = sliceTimeline(timeline, index);
  const base = calculateStandings(players, predictions, results, upToFixtureId, fixtures);
  return applySpecialPoints(base, specialEventsIncluded);
}

export function useStandings(
  players: Player[],
  predictions: Prediction[],
  results: MatchResult[],
  timeline: TimelineStep[],
  replayIndex: number,
) {
  const currentStandings = useMemo(
    () => standingsAt(players, predictions, results, timeline, replayIndex),
    [players, predictions, results, timeline, replayIndex],
  );

  const previousStandings = useMemo(
    () => (replayIndex <= 0 ? null : standingsAt(players, predictions, results, timeline, replayIndex - 1)),
    [players, predictions, results, timeline, replayIndex],
  );

  const currentStep: TimelineStep | null = replayIndex >= 0 ? (timeline[replayIndex] ?? null) : null;

  return { currentStandings, previousStandings, currentStep };
}

function buildZeroStandings(players: Player[]): PlayerStanding[] {
  return [...players]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((player, index) => ({
      player,
      totalPoints: 0,
      rank: index + 1,
      matchPoints: [],
      specialPoints: [],
    }));
}
