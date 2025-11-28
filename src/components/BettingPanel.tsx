import { useState } from 'react';
import { Player } from '@/lib/game';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FireSimple, ChartLine } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { Language, t } from '@/lib/i18n';import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
interface BettingPanelProps {
  balance: number;
  xOdds: number;
  oOdds: number;
  drawOdds: number;
  onPlaceBet: (player: Player | 'draw', amount: number, odds: number) => void;
  disabled: boolean;
  language: Language;
}

export function BettingPanel({
  balance,
  xOdds,
  oOdds,
  drawOdds,
  onPlaceBet,
  disabled,
  language,
}: BettingPanelProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | 'draw' | null>(null);
  const [betAmount, setBetAmount] = useState<string>('10');

  const handlePlaceBet = () => {
    if (!selectedPlayer) return;

    const amount = parseInt(betAmount);
    if (isNaN(amount) || amount <= 0 || amount > balance) return;

    let odds: number;
    if (selectedPlayer === 'X') odds = xOdds;
    else if (selectedPlayer === 'O') odds = oOdds;
    else odds = drawOdds;

    onPlaceBet(selectedPlayer, amount, odds);
    setSelectedPlayer(null);
    setBetAmount('10');
  };

  const potentialWin = () => {
    const amount = parseInt(betAmount);
    if (isNaN(amount) || !selectedPlayer) return 0;

    let odds: number;
    if (selectedPlayer === 'X') odds = xOdds;
    else if (selectedPlayer === 'O') odds = oOdds;
    else odds = drawOdds;

    return Math.round(amount * odds);
  };

  const quickBetAmounts = [10, 25, 50, 100];

  return (
    <Card className="p-6 border-purple-200 dark:border-purple-900 shadow-lg">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FireSimple className="w-6 h-6 text-purple-600" weight="duotone" />
          <div>
            <h3 className="font-semibold text-lg">{t(language, 'totalizator')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t(language, 'balance')}: <span className="font-bold text-purple-600">{balance}</span> {t(language, 'matches')}
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-sm font-medium">{t(language, 'selectOutcome')}</Label>
          <RadioGroup
            value={selectedPlayer || ''}
            onValueChange={(v) => setSelectedPlayer(v as Player | 'draw')}
            disabled={disabled}
            className="grid grid-cols-3 gap-2"
          >
            <label
              htmlFor="outcome-x"
              className={
                selectedPlayer === 'X'
                  ? 'relative flex flex-col items-center gap-2 rounded-lg border-2 border-[var(--color-player-x)] bg-[var(--color-player-x)]/10 p-3 cursor-pointer transition-colors'
                  : 'relative flex flex-col items-center gap-2 rounded-lg border-2 border-border bg-background p-3 cursor-pointer hover:bg-accent/50 transition-colors'
              }
            >
              <RadioGroupItem value="X" id="outcome-x" />
              <span className="font-medium">{t(language, 'xPlayer')}</span>
              <Badge variant="secondary" className="text-xs">
                {xOdds.toFixed(2)}x
              </Badge>
            </label>

            <label
              htmlFor="outcome-o"
              className={
                selectedPlayer === 'O'
                  ? 'relative flex flex-col items-center gap-2 rounded-lg border-2 border-[var(--color-player-o)] bg-[var(--color-player-o)]/10 p-3 cursor-pointer transition-colors'
                  : 'relative flex flex-col items-center gap-2 rounded-lg border-2 border-border bg-background p-3 cursor-pointer hover:bg-accent/50 transition-colors'
              }
            >
              <RadioGroupItem value="O" id="outcome-o" />
              <span className="font-medium">{t(language, 'oPlayer')}</span>
              <Badge variant="secondary" className="text-xs">
                {oOdds.toFixed(2)}x
              </Badge>
            </label>

            <label
              htmlFor="outcome-draw"
              className={
                selectedPlayer === 'draw'
                  ? 'relative flex flex-col items-center gap-2 rounded-lg border-2 border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 p-3 cursor-pointer transition-colors'
                  : 'relative flex flex-col items-center gap-2 rounded-lg border-2 border-border bg-background p-3 cursor-pointer hover:bg-accent/50 transition-colors'
              }
            >
              <RadioGroupItem value="draw" id="outcome-draw" />
              <span className="font-medium">{t(language, 'draw')}</span>
              <Badge variant="secondary" className="text-xs">
                {drawOdds.toFixed(2)}x
              </Badge>
            </label>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label htmlFor="bet-amount" className="text-sm font-medium">
            {t(language, 'betAmount')}
          </Label>
          <Input
            id="bet-amount"
            type="number"
            min="1"
            max={balance}
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            disabled={disabled}
            className="text-center font-mono text-lg"
          />
          <div className="grid grid-cols-4 gap-2">
            {quickBetAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => setBetAmount(amount.toString())}
                disabled={disabled || amount > balance}
                className="text-xs"
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
            className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg"
          >
            <ChartLine className="w-5 h-5 text-purple-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">{t(language, 'potentialWin')}</p>
              <p className="text-lg font-bold text-purple-600">
                {potentialWin()} {t(language, 'matches')}
              </p>
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
          <FireSimple className="mr-2" weight="duotone" />
          {t(language, 'placeBet')}
        </Button>

        {balance < 10 && (
          <p className="text-sm text-center text-red-500">{t(language, 'lowBalance')}</p>
        )}
      </div>
    </Card>
  );
}
