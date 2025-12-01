import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Player, BoardSize } from '@/lib/game';

interface GameBoardProps {
  board: Player[];
  winningLine: number[] | null;
  lastMove: number | null;
  onCellClick?: (index: number) => void;
  disabled?: boolean;
  size?: BoardSize;
}

export function GameBoard({ board, winningLine, lastMove, onCellClick, disabled, size = 3 }: GameBoardProps) {
  const handleClick = (index: number) => {
    if (!disabled && !board[index] && onCellClick) {
      onCellClick(index);
    }
  };

  // Calculate font size based on board size
  const getFontSize = () => {
    switch (size) {
      case 3: return 'text-6xl';
      case 4: return 'text-4xl';
      case 5: return 'text-3xl';
      default: return 'text-6xl';
    }
  };

  return (
    <div 
      className="grid gap-2 w-full max-w-[420px] mx-auto"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
    >
      {board.map((cell, index) => (
        <motion.div
          key={index}
          onClick={() => handleClick(index)}
          className={cn(
            'aspect-square glass-card border-2 rounded-xl flex items-center justify-center relative overflow-hidden',
            winningLine?.includes(index) ? 'border-accent' : 'border-border',
            lastMove === index && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
            !disabled && !cell && onCellClick && 'cursor-pointer hover:bg-white/10 active:scale-95 transition-all'
          )}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, delay: index * 0.02 }}
        >
          {cell && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
              className={cn(
                getFontSize(),
                'font-bold',
                cell === 'X' ? 'text-[var(--color-player-x)]' : 'text-[var(--color-player-o)]'
              )}
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {cell}
            </motion.div>
          )}
          {!cell && !disabled && onCellClick && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center text-2xl opacity-0"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 0.35 }}
              transition={{ duration: 0.2 }}
            >
              <span>👆</span>
            </motion.div>
          )}
          {winningLine?.includes(index) && (
            <motion.div
              className="absolute inset-0 bg-accent/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}
