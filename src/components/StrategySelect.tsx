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

const STRATEGY_DESCRIPTIONS: Record<Language, Record<AIStrategy, string>> = {
  en: {
    random: 'No plan, random moves',
    offensive: 'Attacks first, ignores threats',
    defensive: 'Blocks threats, rarely attacks',
    minimax: 'Thinks ahead, never loses',
  },
  ru: {
    random: 'Без плана, случайные ходы',
    offensive: 'Атакует, игнорирует угрозы',
    defensive: 'Блокирует угрозы, редко атакует',
    minimax: 'Думает наперёд, не проигрывает',
  },
  ar: {
    random: 'بدون خطة، حركات عشوائية',
    offensive: 'يهاجم أولاً، يتجاهل التهديدات',
    defensive: 'يحظر التهديدات، نادراً ما يهاجم',
    minimax: 'يفكر مسبقاً، لا يخسر أبداً',
  },
  zh: {
    random: '无计划，随机走棋',
    offensive: '先攻击，忽视威胁',
    defensive: '阻挡威胁，很少进攻',
    minimax: '深谋远虑，永不输棋',
  },
};

const STRATEGIES: AIStrategy[] = ['random', 'offensive', 'defensive', 'minimax'];

export function StrategySelect({ player, strategy, onStrategyChange, disabled, language }: StrategySelectProps) {
  return (
    <div className="flex flex-col gap-2 glass-card p-3 rounded-lg">
      <label className="text-sm font-medium text-muted-foreground">
        {t(language, 'strategy')} {player}
      </label>
      <Select value={strategy} onValueChange={onStrategyChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STRATEGIES.map((strat) => (
            <SelectItem key={strat} value={strat}>
              <div className="flex flex-col">
                <span className="font-medium">{t(language, `strategies.${strat}` as any)}</span>
                <span className="text-xs text-muted-foreground">{STRATEGY_DESCRIPTIONS[language][strat]}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
