import { useState, useEffect, useRef } from 'react';
import { useKV } from '@github/spark/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretRight, ArrowClockwise } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { GameBoard } from '@/components/GameBoard';
import { PlayerInfo } from '@/components/PlayerInfo';
import { StatsDisplay } from '@/components/StatsDisplay';
import { SpeedControl, GameSpeed, getSpeedDelay } from '@/components/SpeedControl';
import { StrategySelect } from '@/components/StrategySelect';
import { BettingPanel } from '@/components/BettingPanel';
import { BettingHistory } from '@/components/BettingHistory';
import { FloatingMatches } from '@/components/FloatingMatches';
import { OnboardingOverlay } from '@/components/OnboardingOverlay';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ChildModeToggle } from '@/components/ChildModeToggle';
import { Player, GameStatus, Winner, GameStats, checkWinner } from '@/lib/game';
import { AIStrategy, AI_STRATEGIES } from '@/lib/ai';
import { Bet, BetResult, calculateOdds, calculatePayout, createBet } from '@/lib/betting';
import { playMoveSound, playWinSound, playBetSound, playEarnSound, unlockAudio } from '@/lib/sound';
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
    const [balanceBeforeBet, setBalanceBeforeBet] = useState<number | null>(null);
  const [betResults, setBetResults] = useKV<BetResult[]>('bet-results', []);
  const [language, setLanguage] = useKV<Language>('language', 'en');
  const [soundEnabled] = useKV<boolean>('fx-sound', true);
  const [animEnabled] = useKV<boolean>('fx-anim', true);
  const [onboardViewed, setOnboardViewed] = useKV<boolean>('onboard-viewed', false);
  const [childMode] = useKV<boolean>('child-mode', true);

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
    unlockAudio();
    
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
    unlockAudio();
    if (amount > currentBalance) {
      toast.error(t(currentLanguage, 'toasts.insufficientMatches'));
      return;
    }

    // Create bet with proper player marker
    // For draw bets, we use a special marker 'D' that we'll handle separately
    const bet = createBet(player === 'draw' ? 'X' : player, amount, betOdds);
    (bet as any).betType = player; // Store original bet type: 'X', 'O', or 'draw'
      setBalanceBeforeBet(currentBalance);
    
    setCurrentBet(bet);
    setBalance(currentBalance - amount);
    const message = player === 'draw'
      ? t(currentLanguage, 'toasts.betAcceptedDraw', { amount: amount.toString() })
      : t(currentLanguage, 'toasts.betAccepted', { amount: amount.toString(), player });
    toast.success(message);
    playBetSound(!!soundEnabled);
  };

  const handleEarnMatches = () => {
    unlockAudio();
    const EARN_AMOUNT = 50;
    setBalance(currentBalance + EARN_AMOUNT);
    toast.success(t(currentLanguage, 'toasts.matchesEarned', { amount: EARN_AMOUNT.toString() }));
    playEarnSound(!!soundEnabled);
  };

  const makeAIMove = (currentBoard: Player[], player: Player) => {
    const strategy = player === 'X' ? currentXStrategy : currentOStrategy;
    const ai = AI_STRATEGIES[strategy];
    const move = ai.getMove(currentBoard, player);
    
    const newBoard = [...currentBoard];
    newBoard[move] = player;
    
    setBoard(newBoard);
    setLastMove(move);
    playMoveSound(!!soundEnabled);
    
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
        const finalBalance = (balanceBeforeBet ?? currentBalance) - currentBet.amount + payout;
        setBalance(finalBalance);
        setBalanceBeforeBet(null);
        
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
      playWinSound(!!soundEnabled);
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

  // Default language remains English; removed auto-detect to keep consistent onboarding.

  return (
    <div className={"min-h-screen arena-bg py-10 px-4 relative " + (childMode ? 'child-mode' : '')} dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
      {childMode && <div className="fun-bg-overlay" aria-hidden></div>}
      <FloatingMatches />
      <div className="max-w-6xl mx-auto space-y-8 relative">
        <OnboardingOverlay
          language={currentLanguage}
          visible={!onboardViewed}
          onClose={() => setOnboardViewed(true)}
          onLanguageChange={setLanguage}
          childMode={childMode}
        />
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          className="text-center"
        >
          <div className="flex justify-end mb-4 gap-3 items-center">
            <ChildModeToggle language={currentLanguage} />
            <LanguageSwitcher currentLanguage={currentLanguage} onLanguageChange={setLanguage} childMode={childMode} />
          </div>
          {childMode ? (
            <div className="child-banner mx-auto">
              <span className="mascot" aria-hidden>🪵</span>
              <h1>{t(currentLanguage, 'title')}</h1>
            </div>
          ) : (
            <h1
              className="text-5xl font-bold tracking-tight mb-2 text-white drop-shadow-md"
              style={{ letterSpacing: '-0.02em' }}
            >
              {t(currentLanguage, 'title')}
            </h1>
          )}
          <div className="mt-3 flex flex-col items-center gap-3">
            <p className={childMode ? 'tagline typewriter' : 'text-muted-foreground'} data-animate={childMode ? 'true' : 'false'}>
              {t(currentLanguage, 'subtitle')}
              {childMode && <span className="typewriter-caret" aria-hidden></span>}
            </p>
            <Badge variant="secondary" className="balance-chip px-3 py-1 flex items-center gap-2">
              <span className="text-lg">🪵</span>
              <span>{t(currentLanguage, 'balance')}:</span>
              <span className="font-semibold">{currentBalance}</span>
              <span>{t(currentLanguage, 'matches')}</span>
            </Badge>
          </div>
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
              onEarnMatches={handleEarnMatches}
              disabled={status === 'playing' || !!currentBet}
              language={currentLanguage}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card p-6 space-y-6">
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
          <Card className="glass-card p-6 space-y-4">
            <h2 className="text-xl font-semibold">{t(currentLanguage, 'controls')}</h2>
            
            <SpeedControl
              speed={currentSpeed}
              onSpeedChange={setSpeed}
              disabled={status === 'playing'}
              language={currentLanguage}
            />
            <div className="mt-4">
              {/* FX toggles */}
              <div className="flex gap-3">
                <div className="glass-card p-3 rounded-md flex items-center gap-2">
                  <span className="text-xs">Sound</span>
                  <Badge variant="secondary" className={soundEnabled ? 'balance-chip' : ''}>{soundEnabled ? 'ON' : 'OFF'}</Badge>
                </div>
                <div className="glass-card p-3 rounded-md flex items-center gap-2">
                  <span className="text-xs">FX</span>
                  <Badge variant="secondary" className={animEnabled ? 'balance-chip' : ''}>{animEnabled ? 'ON' : 'OFF'}</Badge>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4">{t(currentLanguage, 'statistics')}</h2>
              <StatsDisplay stats={currentStats} language={currentLanguage} />
            </Card>
            
            <BettingHistory
              results={currentBetResults}
              netProfit={currentBetResults.reduce((sum, r) => sum + r.profit, 0)}
              language={currentLanguage}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default App;