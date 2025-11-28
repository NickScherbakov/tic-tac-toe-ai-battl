import { useState } from 'react';
import { Player } from '@/lib/game';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Coins, ChartLine } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

interface BettingPanelProps {
  balance: number;
  xOdds: number;
  oOdds: number;
  drawOdds: number;
  onPlaceBet: (player: Player | 'draw', amount: number, odds: number) => void;
  disabled: boolean;
}

export function BettingPanel({
  balance,
  xOdds,
  oOdds,
  drawOdds,
  onPlaceBet,
  disabled,
}: BettingPanelProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | 'draw' | null>(null);
  const [betAmount, setBetAmount] = useState<string>('10');

  const handlePlaceBet = () => {
    if (!selectedPlayer) return;
    
    const amount = parseInt(betAmount);
    if (isNaN(amount) || amount <= 0 || amount > balance) return;

    const odds = selectedPlayer === 'X' ? xOdds : selectedPlayer === 'O' ? oOdds : drawOdds;
    onPlaceBet(selectedPlayer, amount, odds);
    
    // Сброс после ставки
    setSelectedPlayer(null);
    setBetAmount('10');
  };

  const getPotentialWin = () => {
    if (!selectedPlayer) return 0;
    const amount = parseInt(betAmount) || 0;
    const odds = selectedPlayer === 'X' ? xOdds : selectedPlayer === 'O' ? oOdds : drawOdds;
    return Math.round(amount * odds);
  };

  const quickBets = [5, 10, 25, 50];

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Coins size={24} weight="fill" className="text-amber-500" />
          Тотализатор
        </h2>
        <div className="flex items-center gap-2">
          <Coins size={20} weight="fill" className="text-amber-500" />
          <span className="text-2xl font-bold">{balance}</span>
          <span className="text-sm text-muted-foreground">спичек</span>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label>Выберите исход</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={selectedPlayer === 'X' ? 'default' : 'outline'}
            onClick={() => setSelectedPlayer('X')}
            disabled={disabled}
            className="flex flex-col h-auto py-4"
          >
            <div className="text-2xl font-bold mb-1">X</div>
            <div className="flex items-center gap-1 text-xs">
              <ChartLine size={12} weight="bold" />
              {xOdds.toFixed(2)}
            </div>
          </Button>
          
          <Button
            variant={selectedPlayer === 'draw' ? 'default' : 'outline'}
            onClick={() => setSelectedPlayer('draw')}
            disabled={disabled}
            className="flex flex-col h-auto py-4"
          >
            <div className="text-lg font-bold mb-1">Ничья</div>
            <div className="flex items-center gap-1 text-xs">
              <ChartLine size={12} weight="bold" />
              {drawOdds.toFixed(2)}
            </div>
          </Button>
          
          <Button
            variant={selectedPlayer === 'O' ? 'default' : 'outline'}
            onClick={() => setSelectedPlayer('O')}
            disabled={disabled}
            className="flex flex-col h-auto py-4"
          >
            <div className="text-2xl font-bold mb-1">O</div>
            <div className="flex items-center gap-1 text-xs">
              <ChartLine size={12} weight="bold" />
              {oOdds.toFixed(2)}
            </div>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="bet-amount">Сумма ставки</Label>
        <Input
          id="bet-amount"
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          disabled={disabled}
          min="1"
          max={balance}
          className="text-lg font-semibold"
        />
        
        <div className="flex gap-2">
          {quickBets.map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              onClick={() => setBetAmount(amount.toString())}
              disabled={disabled || amount > balance}
              className="flex-1"
            >
              {amount}
            </Button>
          ))}
        </div>
      </div>

      {selectedPlayer && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted p-3 rounded-lg space-y-2"
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ставка:</span>
            <span className="font-semibold">{betAmount} спичек</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Коэффициент:</span>
            <span className="font-semibold">
              {(selectedPlayer === 'X' ? xOdds : selectedPlayer === 'O' ? oOdds : drawOdds).toFixed(2)}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Возможный выигрыш:</span>
            <span className="text-lg font-bold text-green-600">
              {getPotentialWin()} спичек
            </span>
          </div>
        </motion.div>
      )}

      <Button
        onClick={handlePlaceBet}
        disabled={
          disabled ||
          !selectedPlayer ||
          parseInt(betAmount) <= 0 ||
          parseInt(betAmount) > balance
        }
        className="w-full"
        size="lg"
      >
        Сделать ставку
      </Button>

      {balance < 5 && (
        <div className="text-sm text-amber-600 text-center">
          ⚠️ Низкий баланс! Поставьте меньшую сумму или сбросьте статистику.
        </div>
      )}
    </Card>
  );
}
