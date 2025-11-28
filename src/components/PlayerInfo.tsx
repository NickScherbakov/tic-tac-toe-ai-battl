import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Player } from '@/lib/game';
import { Badge } from '@/components/ui/badge';
import { AIStrategy } from '@/lib/ai';
import { Language, t } from '@/lib/i18n';

interface PlayerInfoProps {
  player: Player;
  strategy: AIStrategy;
  strategyName: string;
  isActive: boolean;
  isThinking?: boolean;
  language: Language;
}

export function PlayerInfo({ player, strategy, strategyName, isActive, isThinking, language }: PlayerInfoProps) {
  const playerColor = player === 'X' ? 'var(--color-player-x)' : 'var(--color-player-o)';

  return (
    <motion.div
      className={cn(
        'p-4 rounded-lg border-2 transition-all duration-300',
        isActive ? 'border-accent bg-accent/5' : 'border-border bg-card'
      )}
      animate={isActive && isThinking ? { scale: [1, 1.02, 1] } : { scale: 1 }}
      transition={{ duration: 1, repeat: isActive && isThinking ? Infinity : 0 }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              backgroundColor: `${playerColor}20`,
              color: playerColor,
              fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            {player}
          </div>
          <div>
            <h3 className="font-semibold text-lg">Player {player}</h3>
            <Badge variant="secondary" className="mt-1">
              {strategyName}
            </Badge>
          </div>
        </div>
        {isActive && isThinking && (
          <motion.div
            className="flex gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: playerColor }}
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
