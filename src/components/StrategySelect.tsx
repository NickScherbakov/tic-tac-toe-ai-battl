import { AIStrategy } from '@/lib/ai';
import { Language, t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StrategySelectProps {
    language: Language;
  player: 'X' | 'O';
  strategy: AIStrategy;
  onStrategyChange: (strategy: AIStrategy) => void;
  disabled?: boolean;
}

const STRATEGIES: { value: AIStrategy; label: string; description: string }[] = [
  { value: 'random', label: 'Random', description: 'Moves randomly' },
  { value: 'offensive', label: 'Offensive', description: 'Prioritizes winning' },
  { value: 'defensive', label: 'Defensive', description: 'Prioritizes blocking' },
  { value: 'minimax', label: 'Perfect (Minimax)', description: 'Optimal strategy' },
];

export function StrategySelect({ player, strategy, onStrategyChange, disabled, language }: StrategySelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-muted-foreground">
        {t(language, 'strategy')} {player}
      </label>
      <Select value={strategy} onValueChange={onStrategyChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STRATEGIES.map((strat) => (
            <SelectItem key={strat.value} value={strat.value}>
              <div className="flex flex-col">
                <span className="font-medium">{t(language, `strategies.${strat.value}` as any)}</span>
                <span className="text-xs text-muted-foreground">{strat.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
