import { Board, Player, getAvailableMoves, makeMove, checkWinner, getOpponent, BoardSize } from './game';

export type AIStrategy = 'random' | 'minimax' | 'defensive' | 'offensive';

export interface AIPlayer {
  strategy: AIStrategy;
  name: string;
  getMove: (board: Board, player: Player, size?: BoardSize) => number;
}

function randomMove(board: Board): number {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return -1;
  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function minimax(board: Board, player: Player, isMaximizing: boolean, size: BoardSize = 3, depth: number = 0, maxDepth: number = 6): number {
  const { winner } = checkWinner(board, size);

  if (winner === player) return 10 - depth;
  if (winner === getOpponent(player)) return depth - 10;
  if (winner === 'draw') return 0;
  
  // Limit depth for larger boards
  if (depth >= maxDepth) return 0;

  const availableMoves = getAvailableMoves(board);
  const currentPlayer = isMaximizing ? player : getOpponent(player);

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const move of availableMoves) {
      const newBoard = makeMove(board, move, currentPlayer);
      const score = minimax(newBoard, player, false, size, depth + 1, maxDepth);
      bestScore = Math.max(score, bestScore);
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (const move of availableMoves) {
      const newBoard = makeMove(board, move, currentPlayer);
      const score = minimax(newBoard, player, true, size, depth + 1, maxDepth);
      bestScore = Math.min(score, bestScore);
    }
    return bestScore;
  }
}

function minimaxMove(board: Board, player: Player, size: BoardSize = 3): number {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return -1;
  
  let bestScore = -Infinity;
  let bestMove = availableMoves[0];
  
  // Reduce depth for larger boards to keep performance acceptable
  const maxDepth = size === 3 ? 9 : size === 4 ? 4 : 3;

  for (const move of availableMoves) {
    const newBoard = makeMove(board, move, player);
    const score = minimax(newBoard, player, false, size, 0, maxDepth);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function defensiveMove(board: Board, player: Player, size: BoardSize = 3): number {
  const opponent = getOpponent(player);
  const availableMoves = getAvailableMoves(board);
  
  if (availableMoves.length === 0) return -1;

  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, opponent);
    const { winner } = checkWinner(testBoard, size);
    if (winner === opponent) {
      return move;
    }
  }

  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, player);
    const { winner } = checkWinner(testBoard, size);
    if (winner === player) {
      return move;
    }
  }

  // Center for any board size
  const center = Math.floor(size * size / 2);
  if (board[center] === null) return center;

  // Corners for any board size
  const corners = [0, size - 1, size * (size - 1), size * size - 1].filter((i) => board[i] === null);
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  return randomMove(board);
}

function offensiveMove(board: Board, player: Player, size: BoardSize = 3): number {
  const availableMoves = getAvailableMoves(board);
  
  if (availableMoves.length === 0) return -1;

  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, player);
    const { winner } = checkWinner(testBoard, size);
    if (winner === player) {
      return move;
    }
  }

  const opponent = getOpponent(player);
  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, opponent);
    const { winner } = checkWinner(testBoard, size);
    if (winner === opponent) {
      return move;
    }
  }

  // Center for any board size
  const center = Math.floor(size * size / 2);
  if (board[center] === null) return center;

  // Corners for any board size
  const corners = [0, size - 1, size * (size - 1), size * size - 1].filter((i) => board[i] === null);
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
