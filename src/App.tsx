import { useState, useEffect, useRef } from 'react';
import { useKV } from '@github/spark/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretRight, ArrowClockwise } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GameBoard } from '@/components/GameBoard';
import { PlayerInfo } from '@/components/PlayerInfo';
import { StatsDisplay } from '@/components/StatsDisplay';
import { SpeedControl, GameSpeed, getSpeedDelay } from '@/components/SpeedControl';
import { StrategySelect } from '@/components/StrategySelect';
import { BettingPanel } from '@/components/BettingPanel';
import { BettingHistory } from '@/components/BettingHistory';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Player, GameStatus, Winner, GameStats, checkWinner } from '@/lib/game';
import { AIStrategy, AI_STRATEGIES } from '@/lib/ai';
import { Bet, BetResult, calculateOdds, calculatePayout, createBet } from '@/lib/betting';
import { Language, t } from '@/lib/i18n';
import { toast } from 'sonner';

function App() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [status, setStatus] = useState<GameStatus>('idle');
  const [winner, setWinner] = useState<Winner>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [lastMove, setLastMove] = useState<number | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  
  const [stats, setStats] = useKV<GameStats>('game-stats', {
    xWins: 0,
    oWins: 0,
    draws: 0,
  });
  
  const [xStrategy, setXStrategy] = useKV<AIStrategy>('x-strategy', 'minimax');
  const [oStrategy, setOStrategy] = useKV<AIStrategy>('o-strategy', 'random');
  const [speed, setSpeed] = useKV<GameSpeed>('game-speed', 'normal');

  // Betting state
  const [balance, setBalance] = useKV<number>('balance', 100);
  const [currentBet, setCurrentBet] = useState<Bet | null>(null);
  const [betResults, setBetResults] = useKV<BetResult[]>('bet-results', []);
  const [language, setLanguage] = useKV<Language>('language', 'en');

  const gameTimeoutRef = useRef<number | null>(null);

  const currentStats = stats ?? { xWins: 0, oWins: 0, draws: 0 };
  const currentXStrategy = xStrategy ?? 'minimax';
  const currentOStrategy = oStrategy ?? 'random';
  const currentSpeed = speed ?? 'normal';
  const currentBalance = balance ?? 100;
  const currentBetResults = betResults ?? [];
  const currentLanguage = language ?? 'en';

  // Calculate odds based on current strategies
  const odds = calculateOdds(currentXStrategy, currentOStrategy);

  const handleStartGame = () => {
    if (status === 'playing') return;
    
    // Check if there's a bet
    if (!currentBet) {
      toast.error(t(currentLanguage, 'toasts.placeBetFirst'));
      return;
    }
    
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setStatus('playing');
    setWinner(null);
    setWinningLine(null);
    setLastMove(null);
    setIsThinking(true);
  };

  const handleNewGame = () => {
    if (gameTimeoutRef.current) {
      clearTimeout(gameTimeoutRef.current);
      gameTimeoutRef.current = null;
    }
    setCurrentBet(null);
    setStatus('idle');
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine(null);
    setLastMove(null);
  };

  const handlePlaceBet = (player: Player | 'draw', amount: number, betOdds: number) => {
    if (amount > currentBalance) {
      toast.error(t(currentLanguage, 'toasts.insufficientMatches'));
      return;
    }

    // Create bet with proper player marker
    // For draw bets, we use a special marker 'D' that we'll handle separately
    const bet = createBet(player === 'draw' ? 'X' : player, amount, betOdds);
    (bet as any).betType = player; // Store original bet type: 'X', 'O', or 'draw'
    
    setCurrentBet(bet);
    setBalance(currentBalance - amount);
    const message = player === 'draw'
      ? t(currentLanguage, 'toasts.betAcceptedDraw', { amount: amount.toString() })
      : t(currentLanguage, 'toasts.betAccepted', { amount: amount.toString(), player });
    toast.success(message);
  };

  const makeAIMove = (currentBoard: Player[], player: Player) => {
    const strategy = player === 'X' ? currentXStrategy : currentOStrategy;
    const ai = AI_STRATEGIES[strategy];
    const move = ai.getMove(currentBoard, player);
    
    const newBoard = [...currentBoard];
    newBoard[move] = player;
    
    setBoard(newBoard);
    setLastMove(move);
    
    const result = checkWinner(newBoard);
    
    if (result.winner) {
      setWinner(result.winner);
      setWinningLine(result.winningLine);
      setStatus('finished');
      setIsThinking(false);
      
      setStats((currentStatsValue) => {
        const prevStats = currentStatsValue ?? { xWins: 0, oWins: 0, draws: 0 };
        const newStats = { ...prevStats };
        if (result.winner === 'X') newStats.xWins++;
        else if (result.winner === 'O') newStats.oWins++;
        else if (result.winner === 'draw') newStats.draws++;
        return newStats;
      });

      // Process betting result
      if (currentBet) {
        const betType = (currentBet as any).betType as Player | 'draw';
        let payout = 0;
        let profit = 0;
        
        if (betType === 'draw') {
          // Bet on draw
          if (result.winner === 'draw') {
            payout = Math.round(currentBet.amount * odds.drawOdds);
            profit = payout - currentBet.amount;
          } else {
            payout = 0;
            profit = -currentBet.amount;
          }
        } else {
          // Bet on X or O
          payout = calculatePayout(currentBet, result.winner);
          profit = payout - currentBet.amount;
        }
        
        const betResult: BetResult = {
          ...currentBet,
          winner: result.winner,
          profit,
        };
        // Store bet type for history display
        (betResult as any).betType = betType;
        
        setBetResults([...currentBetResults, betResult]);
        setBalance(currentBalance + payout);
        
        if (profit > 0) {
          toast.success(t(currentLanguage, 'toasts.youWon', { amount: profit.toString() }), {
            duration: 5000,
          });
        } else if (profit < 0) {
          toast.error(t(currentLanguage, 'toasts.youLost', { amount: (-profit).toString() }), {
            duration: 5000,
          });
        } else {
          toast.info(t(currentLanguage, 'toasts.betReturned'));
        }
      }

      const strategyName = t(currentLanguage, `strategies.${strategy}` as any);
      const resultMessage = 
        result.winner === 'draw' 
          ? t(currentLanguage, 'toasts.gameEndedDraw')
          : t(currentLanguage, 'toasts.playerWinsWith', { player: result.winner, strategy: strategyName });
      
      toast.success(resultMessage);
    } else {
      setCurrentPlayer(player === 'X' ? 'O' : 'X');
    }
  };

  useEffect(() => {
    if (status === 'playing' && currentPlayer) {
      setIsThinking(true);
      
      const delay = getSpeedDelay(currentSpeed);
      
      gameTimeoutRef.current = window.setTimeout(() => {
        makeAIMove(board, currentPlayer);
        setIsThinking(false);
      }, delay);

      return () => {
        if (gameTimeoutRef.current) {
          clearTimeout(gameTimeoutRef.current);
        }
      };
    }
  }, [status, currentPlayer, board, currentSpeed]);

  useEffect(() => {
    return () => {
      if (gameTimeoutRef.current) {
        clearTimeout(gameTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background py-8 px-4" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex justify-end mb-4">
            <LanguageSwitcher currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-2" style={{ letterSpacing: '-0.02em' }}>
            {t(currentLanguage, 'title')}
          </h1>
          <p className="text-muted-foreground">
            {t(currentLanguage, 'subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-semibold mb-4">{t(currentLanguage, 'players')}</h2>
              
              <PlayerInfo
                player="X"
                strategy={currentXStrategy}
                strategyName={t(currentLanguage, `strategies.${currentXStrategy}` as any)}
                isActive={status === 'playing' && currentPlayer === 'X'}
                isThinking={status === 'playing' && currentPlayer === 'X' && isThinking}
                language={currentLanguage}
              />
              
              <PlayerInfo
                player="O"
                strategy={currentOStrategy}
                strategyName={t(currentLanguage, `strategies.${currentOStrategy}` as any)}
                isActive={status === 'playing' && currentPlayer === 'O'}
                isThinking={status === 'playing' && currentPlayer === 'O' && isThinking}
                language={currentLanguage}
              />

              <Separator />

              <StrategySelect
                player="X"
                strategy={currentXStrategy}
                onStrategyChange={setXStrategy}
                disabled={status === 'playing'}
                language={currentLanguage}
              />

              <StrategySelect
                player="O"
                strategy={currentOStrategy}
                onStrategyChange={setOStrategy}
                disabled={status === 'playing'}
                language={currentLanguage}
              />
            </Card>

            <BettingPanel
              balance={currentBalance}
              xOdds={odds.xOdds}
              oOdds={odds.oOdds}
              drawOdds={odds.drawOdds}
              onPlaceBet={handlePlaceBet}
              disabled={status === 'playing' || !!currentBet}
              language={currentLanguage}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 space-y-6">
              <h2 className="text-xl font-semibold">{t(currentLanguage, 'gameBoard')}</h2>
              
              <GameBoard
                board={board}
                winningLine={winningLine}
                lastMove={lastMove}
              />

              <AnimatePresence mode="wait">
                {winner && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Alert>
                      <AlertDescription className="text-center text-lg font-semibold">
                        {winner === 'draw' 
                          ? t(currentLanguage, 'drawResult')
                          : t(currentLanguage, 'playerWins', { player: winner })
                        }
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <Button
                  onClick={handleStartGame}
                  disabled={status === 'playing'}
                  className="flex-1 flex items-center justify-center gap-2"
                  size="lg"
                >
                  <CaretRight weight="fill" />
                  {status === 'idle' ? t(currentLanguage, 'startGame') : t(currentLanguage, 'playing')}
                </Button>
                
                <Button
                  onClick={handleNewGame}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                  size="lg"
                >
                  <ArrowClockwise />
                  {t(currentLanguage, 'newGame')}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">{t(currentLanguage, 'controls')}</h2>
            
            <SpeedControl
              speed={currentSpeed}
              onSpeedChange={setSpeed}
              disabled={status === 'playing'}
              language={currentLanguage}
            />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">{t(currentLanguage, 'statistics')}</h2>
              <StatsDisplay stats={currentStats} language={currentLanguage} />
            </Card>
            
            <BettingHistory
              results={currentBetResults}
              netProfit={currentBetResults.reduce((sum, r) => sum + (r.profit - r.amount), 0)}
              language={currentLanguage}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default App;