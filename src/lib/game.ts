export type Player = 'X' | 'O' | null;
export type Board = Player[];
export type GameStatus = 'idle' | 'playing' | 'finished';
export type Winner = 'X' | 'O' | 'draw' | null;

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

export function checkWinner(board: Board): { winner: Winner; winningLine: number[] | null } {
  for (const combination of WINNING_COMBINATIONS) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningLine: combination };
    }
  }

  if (board.every((cell) => cell !== null)) {
    return { winner: 'draw', winningLine: null };
  }

  return { winner: null, winningLine: null };
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
