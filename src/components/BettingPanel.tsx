import { useState } from 'react';
import { Fire } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type BetChoice = 'X' | 'O' | null;

interface BettingPanelProps {
  matches: number;
  currentBet: number;
  betChoice: BetChoice;
  onBetChange: (amount: number) => void;
  onBetChoiceChange: (choice: BetChoice) => void;
  disabled: boolean;
}

export function BettingPanel({
  matches,
  currentBet,
  betChoice,
  onBetChange,
  onBetChoiceChange,
  disabled,
}: BettingPanelProps) {
  const [inputValue, setInputValue] = useState(currentBet.toString());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= matches) {
      onBetChange(numValue);
    } else if (value === '' || numValue === 0) {
      onBetChange(0);
    }
  };

  const handleQuickBet = (amount: number) => {
    const newAmount = Math.min(amount, matches);
    setInputValue(newAmount.toString());
    onBetChange(newAmount);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Ставки</h2>
        <div className="flex items-center gap-2 text-lg font-medium">
          <Fire className="w-5 h-5 text-orange-500" weight="fill" />
          <span>{matches} спичек</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-muted-foreground">
          Выберите победителя
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={betChoice === 'X' ? 'default' : 'outline'}
            onClick={() => onBetChoiceChange(betChoice === 'X' ? null : 'X')}
            disabled={disabled}
            className={cn(
              'h-16 text-lg font-bold transition-all',
              betChoice === 'X' && 'bg-[var(--color-player-x)] hover:bg-[var(--color-player-x)]/90'
            )}
          >
            Игрок X
          </Button>
          <Button
            variant={betChoice === 'O' ? 'default' : 'outline'}
            onClick={() => onBetChoiceChange(betChoice === 'O' ? null : 'O')}
            disabled={disabled}
            className={cn(
              'h-16 text-lg font-bold transition-all',
              betChoice === 'O' && 'bg-[var(--color-player-o)] hover:bg-[var(--color-player-o)]/90'
            )}
          >
            Игрок O
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-muted-foreground">
          Размер ставки
        </label>
        <div className="flex gap-2">
          <Input
            type="number"
            min={0}
            max={matches}
            value={inputValue}
            onChange={handleInputChange}
            disabled={disabled || !betChoice}
            placeholder="0"
            className="text-center text-lg font-medium"
          />
          <Fire className="w-9 h-9 text-orange-500 self-center" weight="fill" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[10, 25, 50, 100].map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              onClick={() => handleQuickBet(amount)}
              disabled={disabled || !betChoice || matches < amount}
              className="flex-1"
            >
              {amount}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickBet(matches)}
            disabled={disabled || !betChoice || matches === 0}
            className="flex-1"
          >
            Все
          </Button>
        </div>
      </div>

      {betChoice && currentBet > 0 && (
        <Card className="p-3 bg-muted/50 text-center">
          <p className="text-sm">
            Ваша ставка: <span className="font-bold">{currentBet} спичек</span> на{' '}
            <span 
              className="font-bold"
              style={{ color: betChoice === 'X' ? 'var(--color-player-x)' : 'var(--color-player-o)' }}
            >
              Игрока {betChoice}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Выигрыш: {currentBet * 2} спичек
          </p>
        </Card>
      )}
    </div>
  );
}
