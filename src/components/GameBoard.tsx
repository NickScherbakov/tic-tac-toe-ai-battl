import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Player } from '@/lib/game';

interface GameBoardProps {
  board: Player[];
  winningLine: number[] | null;
  lastMove: number | null;
}

export function GameBoard({ board, winningLine, lastMove }: GameBoardProps) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-[400px] mx-auto">
      {board.map((cell, index) => (
        <motion.div
          key={index}
          className={cn(
            'aspect-square bg-card border-2 rounded-lg flex items-center justify-center relative overflow-hidden',
            winningLine?.includes(index) ? 'border-accent' : 'border-border',
            lastMove === index && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
          )}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
        >
          {cell && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
              className={cn(
                'text-6xl font-bold',
                cell === 'X' ? 'text-[var(--color-player-x)]' : 'text-[var(--color-player-o)]'
              )}
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {cell}
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
