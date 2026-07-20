import { describe, expect, it } from 'vitest';
import {
  createReplayHash,
  createShareText,
  getDailyChallenge,
  getUnlockedAchievements,
  mergeLeaderboard,
  parseReplayHash,
  updateWinStreak,
} from './viral';

describe('viral helpers', () => {
  it('encodes and decodes replay payloads', () => {
    const replay = {
      board: ['X', 'O', 'X', null, 'O', null, null, 'X', 'O'],
      boardSize: 3 as const,
      winner: 'X' as const,
      winningLine: [0, 4, 8],
      xStrategy: 'minimax' as const,
      oStrategy: 'offensive' as const,
      predictedOutcome: 'X' as const,
      playerName: 'Nick',
      profit: 42,
      timestamp: 123,
    };

    const hash = createReplayHash(replay);
    expect(parseReplayHash(hash)).toEqual(replay);
  });

  it('creates winning share copy with strategy names', () => {
    const text = createShareText({
      board: [],
      boardSize: 3,
      winner: 'X',
      winningLine: null,
      xStrategy: 'minimax',
      oStrategy: 'random',
      predictedOutcome: 'X',
      playerName: 'Nick',
      profit: 15,
      timestamp: 1,
    }, 'https://example.com/replay');

    expect(text).toContain('Calculated');
    expect(text).toContain('won');
    expect(text).toContain('https://example.com/replay');
  });

  it('keeps only the top 5 leaderboard entries', () => {
    const top = Array.from({ length: 6 }, (_, index) => ({
      id: String(index),
      name: `P${index}`,
      profit: index + 1,
      predictedOutcome: 'X' as const,
      actualWinner: 'X' as const,
      xStrategy: 'minimax' as const,
      oStrategy: 'random' as const,
      timestamp: index,
    })).reduce(mergeLeaderboard, [] as any[]);

    expect(top).toHaveLength(5);
    expect(top[0].profit).toBe(6);
    expect(top.at(-1)?.profit).toBe(2);
  });

  it('increments streaks only on consecutive days', () => {
    const first = updateWinStreak({ current: 0, longest: 0, lastWinDate: null }, '2026-07-18');
    const second = updateWinStreak(first, '2026-07-19');
    const reset = updateWinStreak(second, '2026-07-21');

    expect(second.current).toBe(2);
    expect(reset.current).toBe(1);
    expect(reset.longest).toBe(2);
  });

  it('returns deterministic daily challenges and unlocks achievements', () => {
    const first = getDailyChallenge('2026-07-20');
    const second = getDailyChallenge('2026-07-20');

    expect(first).toEqual(second);

    expect(getUnlockedAchievements({
      existing: [],
      totalGames: 10,
      winRun: 3,
      triedStrategies: ['random', 'defensive', 'offensive', 'minimax'],
      wonBet: true,
      wonAsUnderdog: true,
    })).toEqual(['first-win', 'three-straight', 'underdog', 'marathon', 'strategist']);
  });
});
