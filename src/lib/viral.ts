import type { AIStrategy } from './ai';
import type { BetResult } from './betting';
import type { BoardSize, Player, Winner } from './game';

export type PredictedOutcome = Player | 'draw';
export type AchievementId = 'first-win' | 'three-straight' | 'underdog' | 'marathon' | 'strategist';

export interface BattleReplay {
  board: Player[];
  boardSize: BoardSize;
  winner: Winner;
  winningLine: number[] | null;
  xStrategy: AIStrategy;
  oStrategy: AIStrategy;
  predictedOutcome: PredictedOutcome | null;
  playerName: string;
  profit: number;
  timestamp: number;
}

export interface ChallengeInvite {
  boardSize: BoardSize;
  xStrategy: AIStrategy;
  oStrategy: AIStrategy;
  predictedOutcome: PredictedOutcome;
  challengerName: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  profit: number;
  predictedOutcome: PredictedOutcome;
  actualWinner: Winner;
  xStrategy: AIStrategy;
  oStrategy: AIStrategy;
  timestamp: number;
}

export interface WinStreak {
  current: number;
  longest: number;
  lastWinDate: string | null;
}

export interface DailyChallenge {
  id: string;
  dateKey: string;
  boardSize: BoardSize;
  xStrategy: AIStrategy;
  oStrategy: AIStrategy;
}

export interface DailyChallengeResult {
  winner: Winner;
  completedAt: number;
  profit: number;
}

export interface AchievementDefinition {
  id: AchievementId;
  emoji: string;
  title: string;
  description: string;
}

const APP_URL = 'https://nickscherbakov.github.io/tic-tac-toe-ai-battl/';
const STRATEGY_ORDER: AIStrategy[] = ['random', 'defensive', 'offensive', 'minimax'];
const BASE64_URL_REPLACEMENTS: Record<string, string> = { '+': '-', '/': '_', '=': '' };

export const ACHIEVEMENTS: Record<AchievementId, AchievementDefinition> = {
  'first-win': {
    id: 'first-win',
    emoji: '🏁',
    title: 'First Win',
    description: 'Your very first correct prediction.',
  },
  'three-straight': {
    id: 'three-straight',
    emoji: '🎯',
    title: 'Three in a Row',
    description: 'Guess three winners in a row.',
  },
  underdog: {
    id: 'underdog',
    emoji: '🐺',
    title: 'Underdog Hunter',
    description: 'Back the less-favored side and still win.',
  },
  marathon: {
    id: 'marathon',
    emoji: '🏃',
    title: 'Marathoner',
    description: 'Finish 10 games in total.',
  },
  strategist: {
    id: 'strategist',
    emoji: '🧠',
    title: 'Strategist',
    description: 'Try all 4 AI strategies at least once.',
  },
};

function encodeBase64(value: string) {
  if (typeof btoa === 'function') {
    return btoa(value);
  }

  return Buffer.from(value, 'utf-8').toString('base64');
}

function decodeBase64(value: string) {
  if (typeof atob === 'function') {
    return atob(value);
  }

  return Buffer.from(value, 'base64').toString('utf-8');
}

export function encodePayload<T>(payload: T): string {
  const json = JSON.stringify(payload);
  const encoded = encodeBase64(encodeURIComponent(json));
  return encoded.replace(/[+/=]/g, (char) => BASE64_URL_REPLACEMENTS[char]);
}

export function decodePayload<T>(value: string | null | undefined): T | null {
  if (!value) return null;

  try {
    const padded = `${value}${'='.repeat((4 - (value.length % 4 || 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = decodeURIComponent(decodeBase64(padded));
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

export function createReplayHash(replay: BattleReplay) {
  return encodePayload(replay);
}

export function parseReplayHash(value: string | null | undefined) {
  return decodePayload<BattleReplay>(value);
}

export function createChallengeHash(challenge: ChallengeInvite) {
  return encodePayload(challenge);
}

export function parseChallengeHash(value: string | null | undefined) {
  return decodePayload<ChallengeInvite>(value);
}

export function getAppUrl(params?: Record<string, string | null | undefined>) {
  const url = new URL(APP_URL);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  return url.toString();
}

export function formatStrategyName(strategy: AIStrategy) {
  switch (strategy) {
    case 'random':
      return 'Random';
    case 'defensive':
      return 'Defensive';
    case 'offensive':
      return 'Offensive';
    case 'minimax':
      return 'Calculated';
    default:
      return strategy;
  }
}

export function getPredictedStrategyLabel(
  predictedOutcome: PredictedOutcome | null,
  xStrategy: AIStrategy,
  oStrategy: AIStrategy,
) {
  if (predictedOutcome === 'X') return formatStrategyName(xStrategy);
  if (predictedOutcome === 'O') return formatStrategyName(oStrategy);
  return 'Draw';
}

export function createShareText(replay: BattleReplay, url: string) {
  const strategyLabel = getPredictedStrategyLabel(replay.predictedOutcome, replay.xStrategy, replay.oStrategy);

  if (replay.profit > 0) {
    return `I backed ${strategyLabel} and won! Try to guess the winner → ${url}`;
  }

  return `I watched ${formatStrategyName(replay.xStrategy)} vs ${formatStrategyName(replay.oStrategy)}. Can you guess the winner? → ${url}`;
}

export function createShareLinks(text: string, url: string) {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);

  return {
    x: `https://twitter.com/intent/tweet?text=${encodedText}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    whatsapp: `https://wa.me/?text=${encodedText}`,
    vk: `https://vk.com/share.php?url=${encodedUrl}&title=${encodedText}`,
  };
}

export function mergeLeaderboard(entries: LeaderboardEntry[], nextEntry: LeaderboardEntry) {
  return [...entries, nextEntry]
    .sort((left, right) => right.profit - left.profit || right.timestamp - left.timestamp)
    .slice(0, 5);
}

export function toDateKey(timestamp = Date.now()) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function updateWinStreak(streak: WinStreak, dateKey: string): WinStreak {
  if (streak.lastWinDate === dateKey) return streak;

  const previous = streak.lastWinDate ? new Date(streak.lastWinDate) : null;
  const current = new Date(dateKey);
  const diffInDays = previous ? Math.round((current.getTime() - previous.getTime()) / 86_400_000) : null;
  const nextCurrent = diffInDays === 1 ? streak.current + 1 : 1;

  return {
    current: nextCurrent,
    longest: Math.max(streak.longest, nextCurrent),
    lastWinDate: dateKey,
  };
}

export function getDailyChallenge(dateKey = toDateKey()) : DailyChallenge {
  const seed = dateKey.split('-').reduce((sum, chunk) => sum + Number(chunk), 0);
  const xStrategy = STRATEGY_ORDER[seed % STRATEGY_ORDER.length];
  const oStrategy = STRATEGY_ORDER[(seed + 2) % STRATEGY_ORDER.length];
  const boardSize = ([3, 4, 5] as BoardSize[])[seed % 3];

  return {
    id: `daily-${dateKey}`,
    dateKey,
    boardSize,
    xStrategy,
    oStrategy,
  };
}

export function isDailyChallengeMatch(
  challenge: DailyChallenge,
  xStrategy: AIStrategy,
  oStrategy: AIStrategy,
  boardSize: BoardSize,
) {
  return challenge.xStrategy === xStrategy && challenge.oStrategy === oStrategy && challenge.boardSize === boardSize;
}

export function getUnlockedAchievements(params: {
  existing: AchievementId[];
  totalGames: number;
  winRun: number;
  triedStrategies: AIStrategy[];
  wonBet: boolean;
  wonAsUnderdog: boolean;
}) {
  const unlocked: AchievementId[] = [];
  const existing = new Set(params.existing);

  if (params.wonBet && !existing.has('first-win')) unlocked.push('first-win');
  if (params.winRun >= 3 && !existing.has('three-straight')) unlocked.push('three-straight');
  if (params.wonAsUnderdog && !existing.has('underdog')) unlocked.push('underdog');
  if (params.totalGames >= 10 && !existing.has('marathon')) unlocked.push('marathon');
  if (new Set(params.triedStrategies).size === STRATEGY_ORDER.length && !existing.has('strategist')) unlocked.push('strategist');

  return unlocked;
}

export function createLeaderboardEntry(params: {
  name: string;
  betResult: BetResult;
  predictedOutcome: PredictedOutcome;
  xStrategy: AIStrategy;
  oStrategy: AIStrategy;
}) : LeaderboardEntry {
  return {
    id: params.betResult.id,
    name: params.name,
    profit: params.betResult.profit,
    predictedOutcome: params.predictedOutcome,
    actualWinner: params.betResult.winner,
    xStrategy: params.xStrategy,
    oStrategy: params.oStrategy,
    timestamp: params.betResult.timestamp,
  };
}
