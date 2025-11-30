import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKV } from '@github/spark/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

// Иконки шагов - более современные
const STEP_ICONS = ['🌐', '📚', '🎯', '💰', '⚙️', '🔥'];

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
  const gameTimeoutRef = useRef<number | null>(null);

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

  // Названия шагов
  const stepTitles: Record<Language, string[]> = {
    en: ['Language', 'Rules', 'Practice', 'Betting', 'AI Setup', 'Battle!'],
    ru: ['Язык', 'Правила', 'Практика', 'Ставки', 'Настройка', 'Битва!'],
    ar: ['اللغة', 'القواعد', 'التدريب', 'الرهان', 'الإعداد', 'المعركة!'],
    zh: ['语言', '规则', '练习', '投注', '设置', '对战!'],
  };

  const next = () => setStep(Math.min(6, step + 1));
  const prev = () => setStep(Math.max(1, step - 1));

  const startGame = () => {
    if (status === 'playing') return;
    ensureAudioUnlocked();
    // Очищаем предыдущий таймер если есть
    if (gameTimeoutRef.current) {
      clearTimeout(gameTimeoutRef.current);
      gameTimeoutRef.current = null;
    }
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setStatus('playing');
    setWinner(null);
    setWinningLine(null);
    setLastMove(null);
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

  // useEffect для автоматических ходов ИИ
  useEffect(() => {
    if (status === 'playing' && currentPlayer) {
      setIsThinking(true);
      const delay = getSpeedDelay(speed);
      
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
  }, [status, currentPlayer, board]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (gameTimeoutRef.current) {
        clearTimeout(gameTimeoutRef.current);
      }
    };
  }, []);

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

  // Автоматическая игра ИИ
  useEffect(() => {
    if (status === 'playing' && currentPlayer) {
      const delay = getSpeedDelay(speed);
      gameTimeoutRef.current = window.setTimeout(() => {
        makeAIMove(board, currentPlayer);
      }, delay);
    }
    
    return () => {
      if (gameTimeoutRef.current) {
        clearTimeout(gameTimeoutRef.current);
        gameTimeoutRef.current = null;
      }
    };
  }, [status, currentPlayer, board]);

  // Авто-старт игры на шаге 3
  useEffect(() => {
    if (step === 3 && status === 'idle') {
      // Небольшая задержка для плавности
      const timer = setTimeout(() => {
        startGame();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4 pb-8">
      {/* Современный Header */}
      <div className="mb-5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-4 shadow-2xl">
        {/* Баланс и Badge шага */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <span className="text-2xl">🪵</span>
            </div>
            <div>
              <div className="text-xs text-white/50 uppercase tracking-wider font-medium">{t(language, 'balance')}</div>
              <div className="text-2xl font-bold text-white">{balance}</div>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-purple-500/25">
            <div className="text-xs text-white/70 text-center">{step}/6</div>
            <div className="text-sm font-bold text-white">{stepTitles[language][step - 1]}</div>
          </div>
        </div>

        {/* Современный прогресс-бар */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                s === step 
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-purple-500/50' 
                  : s < step 
                    ? 'bg-emerald-500/80' 
                    : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Навигация */}
        <div className="flex gap-3">
          <button 
            onClick={prev} 
            disabled={step === 1}
            className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 text-white font-medium 
                       disabled:opacity-30 disabled:cursor-not-allowed
                       hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">←</span>
            <span className="text-sm truncate">{step > 1 ? stepTitles[language][step - 2] : ''}</span>
          </button>
          
          <div className="w-16 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30 
                          flex flex-col items-center justify-center">
            <span className="text-xl">{STEP_ICONS[step - 1]}</span>
          </div>
          
          <button 
            onClick={next} 
            disabled={step === 6}
            className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 text-white font-medium 
                       disabled:opacity-30 disabled:cursor-not-allowed
                       hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-sm truncate">{step < 6 ? stepTitles[language][step] : ''}</span>
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`step-${step}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* ШАГ 1: Выбор языка */}
          {step === 1 && (
            <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 
                                flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <span className="text-4xl">🌐</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {language === 'ru' ? 'Выберите язык' : language === 'ar' ? 'اختر اللغة' : language === 'zh' ? '选择语言' : 'Choose Language'}
                </h2>
                <p className="text-white/50 text-sm">
                  {language === 'ru' ? 'Можно изменить в любой момент' : language === 'ar' ? 'يمكنك تغييره في أي وقت' : language === 'zh' ? '可随时更改' : 'You can change this anytime'}
                </p>
              </div>
              <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} childMode={true} />
              <button 
                onClick={next} 
                className="w-full mt-6 h-14 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 
                           text-white font-semibold text-lg shadow-lg shadow-cyan-500/25
                           hover:shadow-cyan-500/40 active:scale-[0.98] transition-all"
              >
                {language === 'ru' ? 'Далее' : language === 'ar' ? 'التالي' : language === 'zh' ? '下一步' : 'Continue'} →
              </button>
            </div>
          )}

          {/* ШАГ 2: Правила игры */}
          {step === 2 && (
            <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 
                                flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <span className="text-3xl">📚</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{t(language, 'rulesTitle') ?? 'Game Rules'}</h2>
              </div>
              
              <div className="space-y-3">
                {/* Цель */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/80 border border-emerald-500/30">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-xl">🎯</span>
                  </div>
                  <div>
                    <div className="font-bold text-emerald-400 text-sm mb-1">
                      {language === 'ru' ? 'Цель' : language === 'ar' ? 'الهدف' : language === 'zh' ? '目标' : 'Goal'}
                    </div>
                    <p className="text-sm text-white font-medium leading-relaxed">{t(language, 'rules.goal')}</p>
                  </div>
                </div>
                
                {/* Как играть */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/80 border border-blue-500/30">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-xl">👆</span>
                  </div>
                  <div>
                    <div className="font-bold text-blue-400 text-sm mb-1">
                      {language === 'ru' ? 'Как играть' : language === 'ar' ? 'كيف تلعب' : language === 'zh' ? '玩法' : 'How to Play'}
                    </div>
                    <p className="text-sm text-white font-medium leading-relaxed">{t(language, 'rules.howToPlay')}</p>
                  </div>
                </div>
                
                {/* Победа */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/80 border border-amber-500/30">
                  <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-xl">🏆</span>
                  </div>
                  <div>
                    <div className="font-bold text-amber-400 text-sm mb-1">
                      {language === 'ru' ? 'Победа' : language === 'ar' ? 'الفوز' : language === 'zh' ? '胜利' : 'Win'}
                    </div>
                    <p className="text-sm text-white font-medium leading-relaxed">{t(language, 'rules.winLines')}</p>
                  </div>
                </div>
                
                {/* Ставки */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/80 border border-purple-500/30">
                  <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-xl">💰</span>
                  </div>
                  <div>
                    <div className="font-bold text-purple-400 text-sm mb-1">
                      {language === 'ru' ? 'Ставки' : language === 'ar' ? 'الرهان' : language === 'zh' ? '投注' : 'Betting'}
                    </div>
                    <p className="text-sm text-white font-medium leading-relaxed">{t(language, 'rules.betting')}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={next} 
                className="w-full mt-6 h-14 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 
                           text-white font-semibold text-lg shadow-lg shadow-orange-500/25
                           hover:shadow-orange-500/40 active:scale-[0.98] transition-all"
              >
                {language === 'ru' ? 'Попробовать' : language === 'ar' ? 'جرب' : language === 'zh' ? '试试' : 'Try it'} →
              </button>
            </div>
          )}

          {/* ШАГ 3: Практика */}
          {step === 3 && (
            <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
              <div className="text-center mb-4">
                <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 
                                flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <span className="text-2xl">🎯</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {language === 'ru' ? 'Попробуйте!' : language === 'ar' ? 'جرب!' : language === 'zh' ? '试试!' : 'Try it!'}
                </h2>
                <p className="text-white/50 text-xs mt-1">
                  {language === 'ru' ? 'Наблюдайте за игрой ИИ' : language === 'ar' ? 'شاهد اللعبة' : language === 'zh' ? '观看AI对战' : 'Watch AI play'}
                </p>
              </div>
              
              <div className="rounded-xl bg-black/30 border border-white/5 p-3 mb-4">
                <GameBoard board={board} winningLine={winningLine} lastMove={lastMove} />
              </div>
              
              {status === 'finished' && winner && (
                <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <span className="text-2xl mr-2">🎉</span>
                  <span className="text-white font-medium">
                    {winner === 'draw' ? t(language, 'drawResult') : t(language, 'playerWins', { player: String(winner) })}
                  </span>
                </div>
              )}
              
              <div className="flex gap-3">
                <button 
                  onClick={startGame} 
                  disabled={status === 'playing'} 
                  className="flex-1 h-14 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 
                             text-white font-semibold text-lg shadow-lg shadow-emerald-500/25
                             disabled:opacity-50 disabled:cursor-not-allowed
                             hover:shadow-emerald-500/40 active:scale-[0.98] transition-all"
                >
                  {status === 'playing' ? '⏳ ...' : '▶ ' + t(language, 'startGame')}
                </button>
                <button 
                  onClick={() => { setBoard(Array(9).fill(null)); setWinner(null); setStatus('idle'); setCurrentBet(null); }} 
                  className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 text-white text-xl
                             hover:bg-white/10 active:scale-95 transition-all"
                >
                  🔄
                </button>
              </div>
              
              {status === 'finished' && (
                <button 
                  onClick={next} 
                  className="w-full mt-3 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 
                             text-white font-medium shadow-lg shadow-purple-500/25
                             hover:shadow-purple-500/40 active:scale-[0.98] transition-all"
                >
                  {language === 'ru' ? 'К ставкам' : language === 'ar' ? 'إلى الرهان' : language === 'zh' ? '去投注' : 'Go to Betting'} →
                </button>
              )}
            </div>
          )}

          {/* ШАГ 4: Ставки */}
          {step === 4 && (
            <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
              <div className="text-center mb-4">
                <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 
                                flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <span className="text-2xl">💰</span>
                </div>
                <h2 className="text-xl font-bold text-white">{t(language, 'betting')}</h2>
                <p className="text-white/50 text-xs mt-1">
                  {language === 'ru' ? 'Выберите победителя' : language === 'ar' ? 'اختر الفائز' : language === 'zh' ? '选择赢家' : 'Pick the winner'}
                </p>
              </div>
              
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
                <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚠️</span>
                      <span className="text-sm text-amber-200/90">{language === 'ru' ? 'Мало спичек!' : 'Low balance!'}</span>
                    </div>
                    <button 
                      onClick={earnMatches} 
                      className="px-4 py-2 rounded-lg bg-amber-500 text-white font-medium text-sm
                                 hover:bg-amber-400 active:scale-95 transition-all"
                    >
                      +50 🪵
                    </button>
                  </div>
                </div>
              )}
              
              <button 
                onClick={next} 
                className="w-full mt-4 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 
                           text-white font-medium shadow-lg shadow-violet-500/25
                           hover:shadow-violet-500/40 active:scale-[0.98] transition-all"
              >
                {language === 'ru' ? 'Настроить ИИ' : language === 'ar' ? 'إعداد الذكاء' : language === 'zh' ? '设置AI' : 'Setup AI'} →
              </button>
            </div>
          )}

          {/* ШАГ 5: Настройка ИИ */}
          {step === 5 && (
            <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
              <div className="text-center mb-4">
                <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 
                                flex items-center justify-center shadow-lg shadow-slate-500/25">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {language === 'ru' ? 'Настройка ИИ' : language === 'ar' ? 'إعداد الذكاء' : language === 'zh' ? 'AI设置' : 'AI Setup'}
                </h2>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center text-white font-bold text-lg">X</div>
                    <span className="text-white font-medium">{t(language, 'xPlayer')}</span>
                  </div>
                  <StrategySelect player="X" strategy={xStrategy} onStrategyChange={setXStrategy} disabled={status==='playing'} language={language} />
                </div>
                
                <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-500 flex items-center justify-center text-white font-bold text-lg">O</div>
                    <span className="text-white font-medium">{t(language, 'oPlayer')}</span>
                  </div>
                  <StrategySelect player="O" strategy={oStrategy} onStrategyChange={setOStrategy} disabled={status==='playing'} language={language} />
                </div>
                
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <span className="text-xl">⚡</span>
                    </div>
                    <span className="text-white font-medium">{t(language, 'gameSpeed')}</span>
                  </div>
                  <SpeedControl speed={speed} onSpeedChange={setSpeed} disabled={status==='playing'} language={language} />
                </div>
              </div>
              
              <button 
                onClick={next} 
                className="w-full mt-6 h-14 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 
                           text-white font-semibold text-lg shadow-lg shadow-red-500/25
                           hover:shadow-red-500/40 active:scale-[0.98] transition-all"
              >
                🔥 {language === 'ru' ? 'В бой!' : language === 'ar' ? 'إلى المعركة!' : language === 'zh' ? '开战!' : 'Battle!'}
              </button>
            </div>
          )}

          {/* ШАГ 6: Битва ИИ */}
          {step === 6 && (
            <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
              <div className="text-center mb-4">
                <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-rose-600 to-orange-500 
                                flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <span className="text-2xl">🔥</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {language === 'ru' ? 'Битва ИИ!' : language === 'ar' ? 'معركة!' : language === 'zh' ? 'AI对战!' : 'AI Battle!'}
                </h2>
                <div className="flex justify-center items-center gap-2 mt-2">
                  <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-medium border border-cyan-500/30">
                    X: {t(language, `strategies.${xStrategy}` as any)}
                  </span>
                  <span className="text-white/30">vs</span>
                  <span className="px-3 py-1 rounded-lg bg-pink-500/20 text-pink-300 text-xs font-medium border border-pink-500/30">
                    O: {t(language, `strategies.${oStrategy}` as any)}
                  </span>
                </div>
              </div>
              
              <div className="rounded-xl bg-black/30 border border-white/5 p-3 mb-4">
                <GameBoard board={board} winningLine={winningLine} lastMove={lastMove} />
              </div>
              
              {status === 'finished' && winner && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center"
                >
                  <span className="text-3xl mr-2">🎉</span>
                  <span className="text-lg text-white font-medium">
                    {winner === 'draw' ? t(language, 'drawResult') : t(language, 'playerWins', { player: String(winner) })}
                  </span>
                </motion.div>
              )}
              
              <div className="flex gap-3">
                <button 
                  onClick={startGame} 
                  disabled={status === 'playing'} 
                  className="flex-1 h-14 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 
                             text-white font-semibold text-lg shadow-lg shadow-orange-500/25
                             disabled:opacity-50 disabled:cursor-not-allowed
                             hover:shadow-orange-500/40 active:scale-[0.98] transition-all"
                >
                  {status === 'playing' ? '⏳ ...' : '🔥 ' + t(language, 'startGame')}
                </button>
                <button 
                  onClick={() => { setBoard(Array(9).fill(null)); setWinner(null); setStatus('idle'); setCurrentBet(null); }} 
                  className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 text-white text-xl
                             hover:bg-white/10 active:scale-95 transition-all"
                >
                  🔄
                </button>
              </div>
              
              {/* Быстрые действия */}
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => setStep(4)} 
                  className="flex-1 h-10 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs font-medium
                             hover:bg-white/10 active:scale-95 transition-all"
                >
                  💰 {t(language, 'betting')}
                </button>
                <button 
                  onClick={() => setStep(5)} 
                  className="flex-1 h-10 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs font-medium
                             hover:bg-white/10 active:scale-95 transition-all"
                >
                  ⚙️ {language === 'ru' ? 'Изменить' : language === 'ar' ? 'تغيير' : language === 'zh' ? '更改' : 'Change AI'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
