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
    minimax: 'Thinks ahead, wins more often',
  },
  ru: {
    random: 'Без плана, случайные ходы',
    offensive: 'Атакует, игнорирует угрозы',
    defensive: 'Блокирует угрозы, редко атакует',
    minimax: 'Думает наперёд, побеждает чаще',
  },
  ar: {
    random: 'بدون خطة، حركات عشوائية',
    offensive: 'يهاجم أولاً، يتجاهل التهديدات',
    defensive: 'يحظر التهديدات، نادراً ما يهاجم',
    minimax: 'يفكر مسبقاً، يفوز أكثر',
  },
  zh: {
    random: '无计划，随机走棋',
    offensive: '先攻击，忽视威胁',
    defensive: '阻挡威胁，很少进攻',
    minimax: '深谋远虑，赢得更多',
  },
};

const STRATEGIES: AIStrategy[] = ['random', 'offensive', 'defensive', 'minimax'];

// Эмодзи для визуального различения стратегий
const STRATEGY_EMOJI: Record<AIStrategy, string> = {
  random: '🎲',
  offensive: '⚔️',
  defensive: '🛡️',
  minimax: '🧠',
};

export function StrategySelect({ player, strategy, onStrategyChange, disabled, language }: StrategySelectProps) {
  return (
    <Select value={strategy} onValueChange={onStrategyChange} disabled={disabled}>
      <SelectTrigger className="w-full h-auto min-h-[44px] bg-slate-800/90 border-slate-600 text-white py-2">
        <div className="flex items-center gap-2 text-left w-full overflow-hidden">
          <span className="text-lg flex-shrink-0">{STRATEGY_EMOJI[strategy]}</span>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-white text-sm truncate">{t(language, `strategies.${strategy}` as any)}</span>
            <span className="text-xs text-slate-300 truncate">{STRATEGY_DESCRIPTIONS[language][strategy]}</span>
          </div>
        </div>
      </SelectTrigger>
      <SelectContent className="bg-slate-800 border-slate-600">
        {STRATEGIES.map((strat) => (
          <SelectItem 
            key={strat} 
            value={strat}
            className="text-white focus:bg-slate-700 focus:text-white py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{STRATEGY_EMOJI[strat]}</span>
              <div className="flex flex-col">
                <span className="font-semibold text-white">{t(language, `strategies.${strat}` as any)}</span>
                <span className="text-xs text-slate-300">{STRATEGY_DESCRIPTIONS[language][strat]}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
