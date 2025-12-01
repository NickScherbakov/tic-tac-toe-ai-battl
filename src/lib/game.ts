export type Player = 'X' | 'O' | null;
export type Board = Player[];
export type GameStatus = 'idle' | 'playing' | 'finished';
export type Winner = 'X' | 'O' | 'draw' | null;
export type BoardSize = 3 | 4 | 5;

export interface GameState {
  board: Board;
  currentPlayer: Player;
  winner: Winner;
  status: GameStatus;
  winningLine: number[] | null;
}

export interface GameStats {
  xWins: number;
  oWins: number;
  draws: number;
}

export const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// Generate winning combinations for any board size
export function getWinningCombinations(size: BoardSize): number[][] {
  const combinations: number[][] = [];
  
  // Rows
  for (let row = 0; row < size; row++) {
    const combo: number[] = [];
    for (let col = 0; col < size; col++) {
      combo.push(row * size + col);
    }
    combinations.push(combo);
  }
  
  // Columns
  for (let col = 0; col < size; col++) {
    const combo: number[] = [];
    for (let row = 0; row < size; row++) {
      combo.push(row * size + col);
    }
    combinations.push(combo);
  }
  
  // Main diagonal
  const mainDiag: number[] = [];
  for (let i = 0; i < size; i++) {
    mainDiag.push(i * size + i);
  }
  combinations.push(mainDiag);
  
  // Anti-diagonal
  const antiDiag: number[] = [];
  for (let i = 0; i < size; i++) {
    antiDiag.push(i * size + (size - 1 - i));
  }
  combinations.push(antiDiag);
  
  return combinations;
}

export function checkWinner(board: Board, size: BoardSize = 3): { winner: Winner; winningLine: number[] | null } {
  const expectedLength = size * size;
  const combinations = size === 3 ? WINNING_COMBINATIONS : getWinningCombinations(size);
  
  for (const combination of combinations) {
    const firstCell = board[combination[0]];
    if (firstCell && combination.every(idx => board[idx] === firstCell)) {
      return { winner: firstCell, winningLine: combination };
    }
  }

  // Check draw: all cells filled (only check up to expectedLength)
  const relevantCells = board.slice(0, expectedLength);
  if (relevantCells.length === expectedLength && relevantCells.every((cell) => cell !== null)) {
    return { winner: 'draw', winningLine: null };
  }

  return { winner: null, winningLine: null };
}

export function createEmptyBoard(size: BoardSize = 3): Board {
  return Array(size * size).fill(null);
}

export function getAvailableMoves(board: Board): number[] {
  return board.reduce<number[]>((moves, cell, index) => {
    if (cell === null) moves.push(index);
    return moves;
  }, []);
}

export function makeMove(board: Board, position: number, player: Player): Board {
  const newBoard = [...board];
  newBoard[position] = player;
  return newBoard;
}

export function getOpponent(player: Player): Player {
  if (player === 'X') return 'O';
  if (player === 'O') return 'X';
  return null;
}
