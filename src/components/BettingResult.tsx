import { motion } from 'framer-motion';
import { Fire, Trophy, X } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { BetChoice } from '@/components/BettingPanel';
import { Winner } from '@/lib/game';

interface BettingResultProps {
  winner: Winner;
  betChoice: BetChoice;
  betAmount: number;
  won: boolean;
}

export function BettingResult({ winner, betChoice, betAmount, won }: BettingResultProps) {
  if (!betChoice || betAmount === 0) return null;

  const winnings = won ? betAmount * 2 : 0;
  const isDraw = winner === 'draw';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className={`p-4 ${won ? 'bg-green-50 border-green-200' : isDraw ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {won ? (
              <Trophy className="w-8 h-8 text-green-500" weight="fill" />
            ) : isDraw ? (
              <Fire className="w-8 h-8 text-yellow-500" weight="fill" />
            ) : (
              <X className="w-8 h-8 text-red-500" weight="bold" />
            )}
            <div>
              <p className={`font-semibold ${won ? 'text-green-700' : isDraw ? 'text-yellow-700' : 'text-red-700'}`}>
                {won ? 'Вы выиграли!' : isDraw ? 'Ничья!' : 'Вы проиграли!'}
              </p>
              <p className="text-sm text-muted-foreground">
                Ставка на Игрока {betChoice}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <span className={`text-xl font-bold ${won ? 'text-green-600' : isDraw ? 'text-yellow-600' : 'text-red-600'}`}>
                {won ? `+${winnings}` : isDraw ? `+${betAmount}` : `-${betAmount}`}
              </span>
              <Fire className={`w-5 h-5 ${won ? 'text-green-500' : isDraw ? 'text-yellow-500' : 'text-red-500'}`} weight="fill" />
            </div>
            <p className="text-xs text-muted-foreground">
              {won ? 'выигрыш' : isDraw ? 'возврат' : 'проигрыш'}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
