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
import { BettingPanel, BetChoice } from '@/components/BettingPanel';
import { BettingResult } from '@/components/BettingResult';
import { Player, GameStatus, Winner, GameStats, checkWinner } from '@/lib/game';
import { AIStrategy, AI_STRATEGIES } from '@/lib/ai';
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
  const [matches, setMatches] = useKV<number>('player-matches', 100);
  const [currentBet, setCurrentBet] = useState(0);
  const [betChoice, setBetChoice] = useState<BetChoice>(null);
  const [lastBetResult, setLastBetResult] = useState<{ won: boolean; amount: number } | null>(null);

  const gameTimeoutRef = useRef<number | null>(null);

  const currentStats = stats ?? { xWins: 0, oWins: 0, draws: 0 };
  const currentXStrategy = xStrategy ?? 'minimax';
  const currentOStrategy = oStrategy ?? 'random';
  const currentSpeed = speed ?? 'normal';
  const currentMatches = matches ?? 100;

  const handleStartGame = () => {
    if (status === 'playing') return;
    
    // Deduct bet from matches when game starts
    if (betChoice && currentBet > 0) {
      setMatches((prev) => (prev ?? 100) - currentBet);
    }
    
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setStatus('playing');
    setWinner(null);
    setWinningLine(null);
    setLastMove(null);
    setIsThinking(true);
    setLastBetResult(null);
  };

  const handleNewGame = () => {
    if (gameTimeoutRef.current) {
      clearTimeout(gameTimeoutRef.current);
      gameTimeoutRef.current = null;
    }
    // Reset betting for new game
    setCurrentBet(0);
    setBetChoice(null);
    setLastBetResult(null);
    
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setStatus('idle');
    setWinner(null);
    setWinningLine(null);
    setLastMove(null);
    setIsThinking(false);
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

      // Handle betting result
      if (betChoice && currentBet > 0) {
        const isDraw = result.winner === 'draw';
        const won = result.winner === betChoice;
        
        if (isDraw) {
          // Return bet on draw
          setMatches((prev) => (prev ?? 0) + currentBet);
          setLastBetResult({ won: false, amount: currentBet });
          toast.info(`Ничья! Ваша ставка ${currentBet} спичек возвращена.`);
        } else if (won) {
          // Win: return bet + winnings (2x)
          setMatches((prev) => (prev ?? 0) + currentBet * 2);
          setLastBetResult({ won: true, amount: currentBet });
          toast.success(`Победа! Вы выиграли ${currentBet * 2} спичек!`);
        } else {
          // Lose: bet already deducted
          setLastBetResult({ won: false, amount: currentBet });
          toast.error(`Проигрыш! Вы потеряли ${currentBet} спичек.`);
        }
      }

      const resultMessage = 
        result.winner === 'draw' 
          ? 'Game ended in a draw!'
          : `Player ${result.winner} wins with ${AI_STRATEGIES[strategy].name}!`;
      
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
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold tracking-tight mb-2" style={{ letterSpacing: '-0.02em' }}>
            AI vs AI Tic-Tac-Toe
          </h1>
          <p className="text-muted-foreground">
            Watch two AI strategies battle it out
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-semibold mb-4">Players</h2>
              
              <PlayerInfo
                player="X"
                strategy={currentXStrategy}
                strategyName={AI_STRATEGIES[currentXStrategy].name}
                isActive={status === 'playing' && currentPlayer === 'X'}
                isThinking={status === 'playing' && currentPlayer === 'X' && isThinking}
              />
              
              <PlayerInfo
                player="O"
                strategy={currentOStrategy}
                strategyName={AI_STRATEGIES[currentOStrategy].name}
                isActive={status === 'playing' && currentPlayer === 'O'}
                isThinking={status === 'playing' && currentPlayer === 'O' && isThinking}
              />

              <Separator />

              <StrategySelect
                player="X"
                strategy={currentXStrategy}
                onStrategyChange={setXStrategy}
                disabled={status === 'playing'}
              />

              <StrategySelect
                player="O"
                strategy={currentOStrategy}
                onStrategyChange={setOStrategy}
                disabled={status === 'playing'}
              />
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="md:col-span-2 lg:col-span-1"
          >
            <Card className="p-6 space-y-6">
              <h2 className="text-xl font-semibold">Game Board</h2>
              
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
                          ? '🤝 Draw! Both AIs played well.' 
                          : `🎉 Player ${winner} wins!`
                        }
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {winner && lastBetResult && (
                  <BettingResult
                    winner={winner}
                    betChoice={betChoice}
                    betAmount={lastBetResult.amount}
                    won={lastBetResult.won}
                  />
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
                  {status === 'idle' ? 'Start Game' : 'Playing...'}
                </Button>
                
                <Button
                  onClick={handleNewGame}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                  size="lg"
                >
                  <ArrowClockwise />
                  New Game
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 lg:col-span-1"
          >
            <Card className="p-6">
              <BettingPanel
                matches={currentMatches}
                currentBet={currentBet}
                betChoice={betChoice}
                onBetChange={setCurrentBet}
                onBetChoiceChange={setBetChoice}
                disabled={status === 'playing'}
              />
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Controls</h2>
            
            <SpeedControl
              speed={currentSpeed}
              onSpeedChange={setSpeed}
              disabled={status === 'playing'}
            />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Statistics</h2>
            <StatsDisplay stats={currentStats} />
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default App;