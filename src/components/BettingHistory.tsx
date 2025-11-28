import { BetResult } from '@/lib/betting';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, MinusCircle, ChartLineUp, ChartLineDown } from '@phosphor-icons/react';
import { Language, t } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

interface BettingHistoryProps {
  results: BetResult[];
  netProfit: number;
  language: Language;
}

export function BettingHistory({ results, netProfit, language }: BettingHistoryProps) {
  const recentResults = results.slice(-10).reverse();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getResultIcon = (result: BetResult) => {
    const betType = (result as any).betType as 'X' | 'O' | 'draw' | undefined;
    
    if (betType === 'draw') {
      // Bet was on draw
      if (result.winner === 'draw') {
        return <CheckCircle size={20} weight="fill" className="text-green-500" />;
      } else {
        return <XCircle size={20} weight="fill" className="text-red-500" />;
      }
    }
    
    // Bet was on X or O
    if (result.winner === 'draw') {
      return <MinusCircle size={20} weight="fill" className="text-red-500" />;
    }
    if (result.winner === result.player) {
      return <CheckCircle size={20} weight="fill" className="text-green-500" />;
    }
    return <XCircle size={20} weight="fill" className="text-red-500" />;
  };

  const getResultText = (result: BetResult) => {
    const betType = (result as any).betType as 'X' | 'O' | 'draw' | undefined;
    
    if (betType === 'draw') {
      return result.winner === 'draw' ? 'Выигрыш' : 'Проигрыш';
    }
    
    if (result.winner === 'draw') return 'Проигрыш';
    if (result.winner === result.player) return 'Выигрыш';
    return 'Проигрыш';
  };

  const getResultColor = (result: BetResult) => {
    const betType = (result as any).betType as 'X' | 'O' | 'draw' | undefined;
    
    if (betType === 'draw') {
      return result.winner === 'draw' ? 'text-green-600' : 'text-red-600';
    }
    
    if (result.winner === 'draw') return 'text-red-600';
    if (result.winner === result.player) return 'text-green-600';
    return 'text-red-600';
  };

  const getBetLabel = (result: BetResult) => {
    const betType = (result as any).betType as 'X' | 'O' | 'draw' | undefined;
    return betType === 'draw' ? 'Ничья' : result.player;
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t(language, 'bettingHistory')}</h2>
        <div className="flex items-center gap-2">
          {netProfit >= 0 ? (
            <ChartLineUp size={20} weight="bold" className="text-green-500" />
          ) : (
            <ChartLineDown size={20} weight="bold" className="text-red-500" />
          )}
          <span className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netProfit >= 0 ? '+' : ''}{netProfit}
          </span>
        </div>
      </div>

      <ScrollArea className="h-[300px] pr-4">
        {recentResults.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {t(language, 'noBets')}
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {recentResults.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-muted p-3 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getResultIcon(result)}
                      <Badge variant="outline" className="text-lg font-bold">
                        {getBetLabel(result)}
                      </Badge>
                      <span className={`text-sm font-semibold ${getResultColor(result)}`}>
                        {getResultText(result)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(result.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="space-x-3">
                      <span className="text-muted-foreground">
                        Ставка: <span className="font-semibold text-foreground">{result.amount}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Коэф: <span className="font-semibold text-foreground">{result.odds.toFixed(2)}</span>
                      </span>
                    </div>
                    <div className={`font-bold ${result.profit > 0 ? 'text-green-600' : result.profit < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {result.profit > 0 ? '+' : ''}{result.profit - result.amount}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{t(language, 'totalBets')}</div>
            <div className="text-lg font-bold">{results.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{t(language, 'wins')}</div>
            <div className="text-lg font-bold text-green-600">
              {results.filter((r) => {
                const betType = (r as any).betType;
                if (betType === 'draw') {
                  return r.winner === 'draw';
                }
                return r.winner === r.player;
              }).length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{t(language, 'losses')}</div>
            <div className="text-lg font-bold text-red-600">
              {results.filter((r) => {
                const betType = (r as any).betType;
                if (betType === 'draw') {
                  return r.winner !== 'draw';
                }
                return r.winner !== r.player && r.winner !== 'draw';
              }).length}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
