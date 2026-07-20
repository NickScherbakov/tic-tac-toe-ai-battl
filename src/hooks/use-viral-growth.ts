import { useEffect, useMemo, useState } from 'react';
import { useKV } from '@github/spark/hooks';
import type { AIStrategy } from '@/lib/ai';
import type { BetResult } from '@/lib/betting';
import type { BoardSize, Player, Winner } from '@/lib/game';
import {
  ACHIEVEMENTS,
  type AchievementDefinition,
  type AchievementId,
  type BattleReplay,
  type DailyChallengeResult,
  type LeaderboardEntry,
  type PredictedOutcome,
  type WinStreak,
  createChallengeHash,
  createLeaderboardEntry,
  createReplayHash,
  createShareLinks,
  createShareText,
  getAppUrl,
  getDailyChallenge,
  getUnlockedAchievements,
  isDailyChallengeMatch,
  mergeLeaderboard,
  toDateKey,
  updateWinStreak,
} from '@/lib/viral';

const EMPTY_STREAK: WinStreak = {
  current: 0,
  longest: 0,
  lastWinDate: null,
};

export interface ShareSummary {
  replay: BattleReplay;
  replayHash: string;
  replayUrl: string;
  challengeHash: string;
  challengeUrl: string;
  shareText: string;
  links: ReturnType<typeof createShareLinks>;
}

export function useViralGrowth() {
  const [playerNameKV, setPlayerNameKV] = useKV<string>('viral-player-name', '');
  const [hasVisitedKV, setHasVisitedKV] = useKV<boolean>('has-visited', false);
  const [gamesPlayedKV, setGamesPlayedKV] = useKV<number>('viral-games-played', 0);
  const [leaderboardKV, setLeaderboardKV] = useKV<LeaderboardEntry[]>('viral-leaderboard', []);
  const [streakKV, setStreakKV] = useKV<WinStreak>('viral-streak', EMPTY_STREAK);
  const [achievementsKV, setAchievementsKV] = useKV<AchievementId[]>('viral-achievements', []);
  const [triedStrategiesKV, setTriedStrategiesKV] = useKV<AIStrategy[]>('viral-tried-strategies', []);
  const [winRunKV, setWinRunKV] = useKV<number>('viral-win-run', 0);
  const [dailyResultsKV, setDailyResultsKV] = useKV<Record<string, DailyChallengeResult>>('viral-daily-results', {});
  const [shareSummary, setShareSummary] = useState<ShareSummary | null>(null);
  const [activeAchievement, setActiveAchievement] = useState<AchievementDefinition | null>(null);

  const playerName = (playerNameKV ?? '').trim();
  const hasVisited = Boolean(hasVisitedKV);
  const gamesPlayed = Number(gamesPlayedKV ?? 0);
  const leaderboard = leaderboardKV ?? [];
  const streak = streakKV ?? EMPTY_STREAK;
  const achievements = achievementsKV ?? [];
  const triedStrategies = triedStrategiesKV ?? [];
  const winRun = Number(winRunKV ?? 0);
  const dailyResults = dailyResultsKV ?? {};
  const dailyChallenge = useMemo(() => getDailyChallenge(), []);

  useEffect(() => {
    if (!hasVisited) {
      setHasVisitedKV(true);
    }
  }, [hasVisited, setHasVisitedKV]);

  const savePlayerName = (value: string) => {
    const cleaned = value.trim().slice(0, 24);
    setPlayerNameKV(cleaned);
    return cleaned;
  };

  const recordStrategyUsage = (...strategies: AIStrategy[]) => {
    const merged = Array.from(new Set([...triedStrategies, ...strategies]));
    if (merged.length !== triedStrategies.length) {
      setTriedStrategiesKV(merged);
    }
    return merged;
  };

  const incrementGames = () => {
    const next = gamesPlayed + 1;
    setGamesPlayedKV(next);
    return next;
  };

  const recordPracticeGame = (strategy: AIStrategy) => {
    const totalGames = incrementGames();
    const strategies = recordStrategyUsage(strategy);
    const unlocked = getUnlockedAchievements({
      existing: achievements,
      totalGames,
      winRun,
      triedStrategies: strategies,
      wonBet: false,
      wonAsUnderdog: false,
    });

    if (unlocked.length) {
      const nextAchievements = [...achievements, ...unlocked];
      setAchievementsKV(nextAchievements);
      setActiveAchievement(ACHIEVEMENTS[unlocked[0]]);
    }
  };

  const recordBattleResult = (params: {
    board: Player[];
    boardSize: BoardSize;
    winner: Winner;
    winningLine: number[] | null;
    xStrategy: AIStrategy;
    oStrategy: AIStrategy;
    predictedOutcome: PredictedOutcome | null;
    betResult: BetResult | null;
    xOdds: number;
    oOdds: number;
  }) => {
    const totalGames = incrementGames();
    const strategies = recordStrategyUsage(params.xStrategy, params.oStrategy);
    const wonBet = Boolean(params.betResult && params.betResult.profit > 0);
    const predictedOutcome = params.predictedOutcome;
    const today = toDateKey();
    const nextWinRun = wonBet ? winRun + 1 : 0;
    setWinRunKV(nextWinRun);

    let nextStreak = streak;
    if (wonBet) {
      nextStreak = updateWinStreak(streak, today);
      setStreakKV(nextStreak);
    }

    const wonAsUnderdog = Boolean(
      wonBet &&
      predictedOutcome &&
      ((predictedOutcome === 'X' && params.xOdds > params.oOdds) ||
        (predictedOutcome === 'O' && params.oOdds > params.xOdds))
    );

    let nextAchievements = achievements;
    const unlocked = getUnlockedAchievements({
      existing: achievements,
      totalGames,
      winRun: nextWinRun,
      triedStrategies: strategies,
      wonBet,
      wonAsUnderdog,
    });

    if (unlocked.length) {
      nextAchievements = [...achievements, ...unlocked];
      setAchievementsKV(nextAchievements);
      setActiveAchievement(ACHIEVEMENTS[unlocked[0]]);
    }

    if (wonBet && params.betResult) {
      const entry = createLeaderboardEntry({
        name: playerName || 'Player',
        betResult: params.betResult,
        predictedOutcome: predictedOutcome ?? 'draw',
        xStrategy: params.xStrategy,
        oStrategy: params.oStrategy,
      });
      setLeaderboardKV(mergeLeaderboard(leaderboard, entry));
    }

    if (isDailyChallengeMatch(dailyChallenge, params.xStrategy, params.oStrategy, params.boardSize)) {
      setDailyResultsKV({
        ...dailyResults,
        [dailyChallenge.id]: {
          winner: params.winner,
          completedAt: Date.now(),
          profit: params.betResult?.profit ?? 0,
        },
      });
    }

    const replay: BattleReplay = {
      board: params.board,
      boardSize: params.boardSize,
      winner: params.winner,
      winningLine: params.winningLine,
      xStrategy: params.xStrategy,
      oStrategy: params.oStrategy,
      predictedOutcome,
      playerName: playerName || 'Player',
      profit: params.betResult?.profit ?? 0,
      timestamp: Date.now(),
    };

    const replayHash = createReplayHash(replay);
    const replayUrl = getAppUrl({ replay: replayHash });
    const challengeHash = createChallengeHash({
      boardSize: params.boardSize,
      xStrategy: params.xStrategy,
      oStrategy: params.oStrategy,
      predictedOutcome: predictedOutcome ?? (params.winner === null ? 'draw' : params.winner),
      challengerName: playerName || 'Player',
    });
    const challengeUrl = getAppUrl({ challenge: challengeHash });
    const shareText = createShareText(replay, replayUrl);
    const links = createShareLinks(shareText, replayUrl);

    const summary = {
      replay,
      replayHash,
      replayUrl,
      challengeHash,
      challengeUrl,
      shareText,
      links,
    } satisfies ShareSummary;

    setShareSummary(summary);

    return {
      shareSummary: summary,
      achievements: nextAchievements,
      streak: nextStreak,
    };
  };

  return {
    playerName,
    hasVisited,
    gamesPlayed,
    leaderboard,
    streak,
    achievements,
    dailyChallenge,
    dailyResult: dailyResults[dailyChallenge.id] ?? null,
    shareSummary,
    activeAchievement,
    savePlayerName,
    dismissAchievement: () => setActiveAchievement(null),
    recordPracticeGame,
    recordBattleResult,
  };
}
