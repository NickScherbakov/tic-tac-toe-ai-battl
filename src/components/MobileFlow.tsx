import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKV } from '@github/spark/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { GameBoard } from '@/components/GameBoard';
import { BettingPanel } from '@/components/BettingPanel';
import { StrategySelect } from '@/components/StrategySelect';
import { SpeedControl, GameSpeed, getSpeedDelay } from '@/components/SpeedControl';
import { Player, GameStatus, Winner, checkWinner } from '@/lib/game';
import { AIStrategy, AI_STRATEGIES } from '@/lib/ai';
import { Bet, BetResult, calculateOdds, calculatePayout, createBet } from '@/lib/betting';
import { Language, t } from '@/lib/i18n';
import { ensureAudioUnlocked, playBetSound, playEarnSound, playMoveSound, playWinSound } from '@/lib/sound';
import { toast } from 'sonner';

/**
 * Мобильный линейный флоу: 1) язык, 2) правила, 3) игрок vs ИИ,
 * 4) ставки и правила, 5) конфиг стратегии ИИ, 6) ИИ vs ИИ.
 */
export function MobileFlow() {
  // общий стейт приложения, упрощённый для мобильного флоу
  const [languageKV, setLanguageKV] = useKV<Language>('mobile-language', 'en');
  const language = languageKV ?? 'en';
  const setLanguage = (l: Language) => setLanguageKV(l);
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [status, setStatus] = useState<GameStatus>('idle');
  const [winner, setWinner] = useState<Winner>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [lastMove, setLastMove] = useState<number | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const [xStrategy, setXStrategy] = useState<AIStrategy>('minimax');
  const [oStrategy, setOStrategy] = useState<AIStrategy>('random');
  const [speed, setSpeed] = useState<GameSpeed>('normal');

  const [balanceKV, setBalanceKV] = useKV<number>('mobile-balance', 100);
  const balance = balanceKV ?? 100;
  const setBalance = (n: number) => setBalanceKV(n);
  const [currentBetKV, setCurrentBetKV] = useKV<Bet | null>('mobile-current-bet', null);
  const currentBet = currentBetKV ?? null;
  const setCurrentBet = (b: Bet | null) => setCurrentBetKV(b);
  const [betResultsKV, setBetResultsKV] = useKV<BetResult[]>('mobile-bet-results', []);
  const betResults = betResultsKV ?? [];
  const setBetResults = (arr: BetResult[]) => setBetResultsKV(arr);
  const [balanceBeforeBet, setBalanceBeforeBet] = useState<number | null>(null);
  const [autoStepLock, setAutoStepLock] = useState<boolean>(false);

  const odds = calculateOdds(xStrategy, oStrategy);

  const [stepKV, setStepKV] = useKV<number>('mobile-step', 1);
  const step = stepKV ?? 1;
  const setStep = (n: number) => setStepKV(n);

  const next = () => setStep(Math.min(6, step + 1));
  const prev = () => setStep(Math.max(1, step - 1));

  const startGame = () => {
    if (status === 'playing') return;
    ensureAudioUnlocked();
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setStatus('playing');
    setWinner(null);
    setWinningLine(null);
    setLastMove(null);
    setIsThinking(true);
    const delay = getSpeedDelay(speed);
    setTimeout(() => {
      makeAIMove(board, currentPlayer);
      setIsThinking(false);
    }, delay);
  };

  const makeAIMove = (currentBoard: Player[], player: Player) => {
    const strategy = player === 'X' ? xStrategy : oStrategy;
    const ai = AI_STRATEGIES[strategy];
    const move = ai.getMove(currentBoard, player);
    const newBoard = [...currentBoard];
    newBoard[move] = player;
    setBoard(newBoard);
    setLastMove(move);
    playMoveSound(true);
    const result = checkWinner(newBoard);
    if (result.winner) {
      setWinner(result.winner);
      setWinningLine(result.winningLine);
      setStatus('finished');
      setIsThinking(false);
      // лёгкая вибрация при завершении партии (если поддерживается)
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate?.(result.winner === 'draw' ? 30 : [20, 30, 20]);
        }
      } catch {}
      // подсказка навигации после завершения игры
      if (step === 3 && !autoStepLock) {
        setAutoStepLock(true);
        toast.info(t(language, 'betting') + ': ' + t(language, 'step') + ' 4');
        // авто-переход к ставкам через короткую задержку
        setTimeout(() => {
          setStep(4);
          setAutoStepLock(false);
        }, 800);
      }
      // ставки
      if (currentBet) {
        const betType = (currentBet as any).betType as Player | 'draw';
        let payout = 0;
        let profit = 0;
        if (betType === 'draw') {
          if (result.winner === 'draw') {
            payout = Math.round(currentBet.amount * odds.drawOdds);
            profit = payout - currentBet.amount;
          } else {
            payout = 0;
            profit = -currentBet.amount;
          }
        } else {
          payout = calculatePayout(currentBet, result.winner);
          profit = payout - currentBet.amount;
        }
        const betResult: BetResult = { ...currentBet, winner: result.winner, profit } as BetResult;
        (betResult as any).betType = betType;
        setBetResults([...betResults, betResult]);
        const finalBalance = (balanceBeforeBet ?? balance) - currentBet.amount + payout;
        setBalance(finalBalance);
        setBalanceBeforeBet(null);
        if (profit > 0) toast.success(t(language, 'toasts.youWon', { amount: profit.toString() }));
        else if (profit < 0) toast.error(t(language, 'toasts.youLost', { amount: (-profit).toString() }));
        else toast.info(t(language, 'toasts.betReturned'));
      }
      playWinSound(true);
    } else {
      setCurrentPlayer(player === 'X' ? 'O' : 'X');
    }
  };

  const placeBet = (player: Player | 'draw', amount: number, betOdds: number) => {
    ensureAudioUnlocked();
    if (amount > balance) {
      toast.error(t(language, 'toasts.insufficientMatches'));
      return;
    }
    const bet = createBet(player === 'draw' ? 'X' : player, amount, betOdds);
    (bet as any).betType = player;
    setBalanceBeforeBet(balance);
    setCurrentBet(bet);
    setBalance(balance - amount);
    const message = player === 'draw'
      ? t(language, 'toasts.betAcceptedDraw', { amount: amount.toString() })
      : t(language, 'toasts.betAccepted', { amount: amount.toString(), player: String(player) });
    toast.success(message);
    playBetSound(true);
  };

  const earnMatches = () => {
    const EARN_AMOUNT = 50;
    setBalance(balance + EARN_AMOUNT);
    toast.success(t(language, 'toasts.matchesEarned', { amount: EARN_AMOUNT.toString() }));
    playEarnSound(true);
  };

  return (
    <div className="min-h-screen arena-bg p-4">
      <Card className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm">{t(language, 'balance')}: {balance} {t(language, 'matches')}</div>
          <div className="text-sm">{t(language, 'gameBoard')}</div>
        </div>
        <Separator />
        {/* Прогресс по шагам */}
        <div className="w-full h-2 bg-black/20 rounded overflow-hidden">
          <div
            className={"h-full transition-all " + (step < 4 ? 'bg-white/60' : 'bg-green-400/70')}
            style={{ width: `${(step / 6) * 100}%`, transition: 'width 200ms ease' }}
            aria-hidden
          />
        </div>
        <div className="flex justify-between gap-2">
          <Button onClick={prev} variant="outline" disabled={step===1}>◀</Button>
          <div className="text-sm">{t(language, 'step')} {step} / 6</div>
          <Button onClick={next} variant="outline" disabled={step===6}>▶</Button>
        </div>
      </Card>

      <AnimatePresence mode="wait">
        <motion.div
          key={`step-${step}`}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          {step === 1 && (
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">{t(language, 'language')}</h2>
              <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} childMode={true} />
            </Card>
          )}

          {step === 2 && (
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">{t(language, 'rulesTitle') ?? 'Rules'}</h2>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">{t(language, 'rules.goal')}</p>
                <p className="text-muted-foreground">{t(language, 'rules.howToPlay')}</p>
                <p className="text-muted-foreground">{t(language, 'rules.winLines')}</p>
                <p className="text-muted-foreground">{t(language, 'rules.betting')}</p>
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">{t(language, 'gameBoard')}</h2>
              <GameBoard board={board} winningLine={winningLine} lastMove={lastMove} />
              {status === 'finished' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="text-sm text-muted-foreground">{t(language, 'betting')} — {t(language, 'step')} 4</div>
                  <Button onClick={() => setStep(4)} size="sm" variant="secondary">{t(language, 'betting')}</Button>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={startGame} disabled={status==='playing'} className="flex-1 md:h-10 h-12">{t(language, 'startGame')}</Button>
                <Button onClick={() => { setBoard(Array(9).fill(null)); setWinner(null); setStatus('idle'); }} variant="outline" className="md:h-10 h-12">{t(language, 'newGame')}</Button>
              </div>
            </Card>
          )}

          {step === 4 && (
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">{t(language, 'betting')}</h2>
              <BettingPanel
                balance={balance}
                xOdds={odds.xOdds}
                oOdds={odds.oOdds}
                drawOdds={odds.drawOdds}
                onPlaceBet={placeBet}
                onEarnMatches={earnMatches}
                disabled={status === 'playing' || !!currentBet}
                language={language}
              />
              {balance < 20 && (
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">{t(language, 'lowBalance')}</span>
                  <Button size="sm" onClick={earnMatches} variant="secondary">{t(language, 'earnMatches.title')}</Button>
                </div>
              )}
            </Card>
          )}

          {step === 5 && (
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">{t(language, 'players')}</h2>
              <StrategySelect player="X" strategy={xStrategy} onStrategyChange={setXStrategy} disabled={status==='playing'} language={language} />
              <StrategySelect player="O" strategy={oStrategy} onStrategyChange={setOStrategy} disabled={status==='playing'} language={language} />
              <Separator />
              <SpeedControl speed={speed} onSpeedChange={setSpeed} disabled={status==='playing'} language={language} />
            </Card>
          )}

          {step === 6 && (
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">{t(language, 'gameBoard')} (AI vs AI)</h2>
              <GameBoard board={board} winningLine={winningLine} lastMove={lastMove} />
              {status === 'finished' && (
                <div className="text-center text-sm text-muted-foreground">{t(language, 'playerWins', { player: String(winner ?? '') })}</div>
              )}
              <div className="flex gap-2">
                <Button onClick={startGame} disabled={status==='playing'} className="flex-1 md:h-10 h-12">{t(language, 'startGame')}</Button>
                <Button onClick={() => { setBoard(Array(9).fill(null)); setWinner(null); setStatus('idle'); }} variant="outline" className="md:h-10 h-12">{t(language, 'newGame')}</Button>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
