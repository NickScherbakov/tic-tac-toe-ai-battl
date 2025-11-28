import { Player, Winner } from './game';
import { AIStrategy } from './ai';

export interface Bet {
  id: string;
  player: Player;
  amount: number;
  odds: number;
  timestamp: number;
}

export interface BetResult extends Bet {
  winner: Winner;
  profit: number;
}

export interface BettingStats {
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  netProfit: number;
}

// Рейтинг силы стратегий (чем выше, тем лучше)
const STRATEGY_STRENGTH: Record<AIStrategy, number> = {
  minimax: 10,
  alphabeta: 10,
  mcts: 9,
  defensive: 6,
  offensive: 6,
  random: 1,
};

/**
 * Рассчитывает коэффициенты для ставок на основе силы стратегий
 */
export function calculateOdds(
  xStrategy: AIStrategy,
  oStrategy: AIStrategy
): { xOdds: number; oOdds: number; drawOdds: number } {
  const xStrength = STRATEGY_STRENGTH[xStrategy];
  const oStrength = STRATEGY_STRENGTH[oStrategy];
  
  // Базовые коэффициенты
  let xOdds: number;
  let oOdds: number;
  
  if (xStrength === oStrength) {
    // Равные силы - равные коэффициенты
    xOdds = 2.0;
    oOdds = 2.0;
  } else {
    // Рассчитываем на основе разницы в силе
    const totalStrength = xStrength + oStrength;
    const xProbability = xStrength / totalStrength;
    const oProbability = oStrength / totalStrength;
    
    // Конвертируем вероятность в коэффициенты (с маржой букмекера 10%)
    xOdds = Math.max(1.1, (0.9 / xProbability));
    oOdds = Math.max(1.1, (0.9 / oProbability));
  }
  
  // Коэффициент на ничью зависит от силы стратегий
  // Чем сильнее обе стратегии, тем выше вероятность ничьи
  const avgStrength = (xStrength + oStrength) / 2;
  const drawOdds = avgStrength >= 9 ? 2.5 : avgStrength >= 6 ? 3.5 : 5.0;
  
  // Округляем до 2 знаков
  return {
    xOdds: Math.round(xOdds * 100) / 100,
    oOdds: Math.round(oOdds * 100) / 100,
    drawOdds,
  };
}

/**
 * Рассчитывает выигрыш по ставке
 */
export function calculatePayout(bet: Bet, winner: Winner): number {
  if (winner === null) return 0;
  
  if (winner === 'draw') {
    // Возвращаем ставку
    return bet.amount;
  }
  
  if (winner === bet.player) {
    // Выигрыш = ставка * коэффициент
    return Math.round(bet.amount * bet.odds);
  }
  
  // Проигрыш
  return 0;
}

/**
 * Создает новую ставку
 */
export function createBet(
  player: Player,
  amount: number,
  odds: number
): Bet {
  return {
    id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    player,
    amount,
    odds,
    timestamp: Date.now(),
  };
}

/**
 * Рассчитывает статистику ставок
 */
export function calculateBettingStats(results: BetResult[]): BettingStats {
  return results.reduce(
    (stats, result) => ({
      totalBets: stats.totalBets + 1,
      totalWagered: stats.totalWagered + result.amount,
      totalWon: stats.totalWon + result.profit,
      netProfit: stats.netProfit + (result.profit - result.amount),
    }),
    {
      totalBets: 0,
      totalWagered: 0,
      totalWon: 0,
      netProfit: 0,
    }
  );
}
