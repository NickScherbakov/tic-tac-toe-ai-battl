import { Board, Player, getAvailableMoves, makeMove, checkWinner, getOpponent } from './game';

export type AIStrategy = 'random' | 'minimax' | 'defensive' | 'offensive';

export interface AIPlayer {
  strategy: AIStrategy;
  name: string;
  getMove: (board: Board, player: Player) => number;
}

function randomMove(board: Board): number {
  const availableMoves = getAvailableMoves(board);
  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function minimax(board: Board, player: Player, isMaximizing: boolean, depth: number = 0): number {
  const { winner } = checkWinner(board);

  if (winner === player) return 10 - depth;
  if (winner === getOpponent(player)) return depth - 10;
  if (winner === 'draw') return 0;

  const availableMoves = getAvailableMoves(board);
  const currentPlayer = isMaximizing ? player : getOpponent(player);

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const move of availableMoves) {
      const newBoard = makeMove(board, move, currentPlayer);
      const score = minimax(newBoard, player, false, depth + 1);
      bestScore = Math.max(score, bestScore);
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (const move of availableMoves) {
      const newBoard = makeMove(board, move, currentPlayer);
      const score = minimax(newBoard, player, true, depth + 1);
      bestScore = Math.min(score, bestScore);
    }
    return bestScore;
  }
}

function minimaxMove(board: Board, player: Player): number {
  const availableMoves = getAvailableMoves(board);
  let bestScore = -Infinity;
  let bestMove = availableMoves[0];

  for (const move of availableMoves) {
    const newBoard = makeMove(board, move, player);
    const score = minimax(newBoard, player, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function defensiveMove(board: Board, player: Player): number {
  const opponent = getOpponent(player);
  const availableMoves = getAvailableMoves(board);

  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, opponent);
    const { winner } = checkWinner(testBoard);
    if (winner === opponent) {
      return move;
    }
  }

  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, player);
    const { winner } = checkWinner(testBoard);
    if (winner === player) {
      return move;
    }
  }

  if (board[4] === null) return 4;

  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  return randomMove(board);
}

function offensiveMove(board: Board, player: Player): number {
  const availableMoves = getAvailableMoves(board);

  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, player);
    const { winner } = checkWinner(testBoard);
    if (winner === player) {
      return move;
    }
  }

  const opponent = getOpponent(player);
  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, opponent);
    const { winner } = checkWinner(testBoard);
    if (winner === opponent) {
      return move;
    }
  }

  if (board[4] === null) return 4;

  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  return randomMove(board);
}

export const AI_STRATEGIES: Record<AIStrategy, AIPlayer> = {
  random: {
    strategy: 'random',
    name: 'Random',
    getMove: randomMove,
  },
  minimax: {
    strategy: 'minimax',
    name: 'Perfect (Minimax)',
    getMove: minimaxMove,
  },
  defensive: {
    strategy: 'defensive',
    name: 'Defensive',
    getMove: defensiveMove,
  },
  offensive: {
    strategy: 'offensive',
    name: 'Offensive',
    getMove: offensiveMove,
  },
};
