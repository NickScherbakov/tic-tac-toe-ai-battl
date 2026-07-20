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
import { Player, GameStatus, Winner, checkWinner, BoardSize, createEmptyBoard } from '@/lib/game';
import { AIStrategy, AI_STRATEGIES } from '@/lib/ai';
import { Bet, BetResult, calculateOdds, calculatePayout, createBet } from '@/lib/betting';
import { Language, t } from '@/lib/i18n';
import { ensureAudioUnlocked, playBetSound, playEarnSound, playMoveSound, playWinSound } from '@/lib/sound';
import { toast } from 'sonner';
import { useViralGrowth } from '@/hooks/use-viral-growth';
import { AchievementPopup, AchievementsCard, DailyChallengeCard, HallOfFameCard, QuickStartButton, SharePanel, saveReplayCardAsImage } from '@/components/ViralWidgets';
import { parseChallengeHash, parseReplayHash, type BattleReplay, type ChallengeInvite } from '@/lib/viral';

// Иконки шагов - более современные
const STEP_ICONS = ['🌐', '📚', '🎯', '💰', '⚙️', '🔥'];

// Генератор математических задач для устного счёта
type MathProblem = {
  question: string;
  answer: number;
  hint: string; // подсказка для хода решения
};

function generateMathProblem(): MathProblem {
  const types = ['add', 'subtract', 'multiply', 'mixed'] as const;
  const type = types[Math.floor(Math.random() * types.length)];
  
  let a: number, b: number, c: number, answer: number, question: string, hint: string;
  
  switch (type) {
    case 'add':
      a = Math.floor(Math.random() * 50) + 10; // 10-59
      b = Math.floor(Math.random() * 50) + 10; // 10-59
      answer = a + b;
      question = `${a} + ${b} = ?`;
      hint = `${a} + ${b} = ${Math.floor(a/10)*10} + ${a%10} + ${b} = ...`;
      break;
    case 'subtract':
      a = Math.floor(Math.random() * 50) + 30; // 30-79
      b = Math.floor(Math.random() * 25) + 5;  // 5-29
      answer = a - b;
      question = `${a} − ${b} = ?`;
      hint = `${a} − ${b} = ${a} − ${Math.floor(b/10)*10} − ${b%10} = ...`;
      break;
    case 'multiply':
      a = Math.floor(Math.random() * 9) + 2;  // 2-10
      b = Math.floor(Math.random() * 9) + 2;  // 2-10
      answer = a * b;
      question = `${a} × ${b} = ?`;
      hint = `${a} × ${b} = ${a} взять ${b} раз = ...`;
      break;
    case 'mixed':
      a = Math.floor(Math.random() * 20) + 5;  // 5-24
      b = Math.floor(Math.random() * 10) + 2;  // 2-11
      c = Math.floor(Math.random() * 10) + 1;  // 1-10
      answer = a + b * c;
      question = `${a} + ${b} × ${c} = ?`;
      hint = `Сначала умножение: ${b} × ${c} = ${b*c}, потом ${a} + ${b*c} = ...`;
      break;
    default:
      a = 5; b = 3; answer = 8; question = '5 + 3 = ?'; hint = '5 + 3 = 8';
  }
  
  return { question, answer, hint };
}

function generateWrongAnswers(correct: number): number[] {
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const offset = Math.floor(Math.random() * 20) - 10;
    const wrong = correct + offset;
    if (wrong !== correct && wrong > 0) {
      wrongs.add(wrong);
    }
  }
  return Array.from(wrongs);
}

/**
 * Мобильный линейный флоу: 1) язык, 2) правила, 3) игрок vs ИИ,
 * 4) ставки и правила, 5) конфиг стратегии ИИ, 6) ИИ vs ИИ.
 */
export function MobileFlow() {
  const {
    playerName,
    hasVisited,
    gamesPlayed,
    leaderboard,
    streak,
    achievements,
    dailyChallenge,
    dailyResult,
    shareSummary,
    activeAchievement,
    savePlayerName,
    dismissAchievement,
    recordPracticeGame,
    recordBattleResult,
  } = useViralGrowth();
  const [playerNameDraft, setPlayerNameDraft] = useState(playerName);
  const [sharedReplay, setSharedReplay] = useState<BattleReplay | null>(null);
  const [challengeInvite, setChallengeInvite] = useState<ChallengeInvite | null>(null);
  // общий стейт приложения, упрощённый для мобильного флоу
  const [languageKV, setLanguageKV] = useKV<Language>('mobile-language', 'en');
  const language = languageKV ?? 'en';
  const setLanguage = (l: Language) => setLanguageKV(l);
  const [battleBoardSize, setBattleBoardSize] = useState<BoardSize>(3);
  const [board, setBoard] = useState<Player[]>(createEmptyBoard(3));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [status, setStatus] = useState<GameStatus>('idle');
  const [winner, setWinner] = useState<Winner>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [lastMove, setLastMove] = useState<number | null>(null);
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

  // Состояние для мини-игры "Заработай спички"
  const [mathProblem, setMathProblem] = useState<MathProblem | null>(null);
  const [mathAnswerOptions, setMathAnswerOptions] = useState<number[]>([]);
  const [showMathGame, setShowMathGame] = useState(false);
  const [mathWorkNotes, setMathWorkNotes] = useState(''); // блокнот для хода вычислений
  const [mathResult, setMathResult] = useState<'correct' | 'wrong' | null>(null);

  // Состояние для шага 3: Практика (Человек vs ИИ)
  const [practiceAIStrategy, setPracticeAIStrategy] = useState<AIStrategy>('random');
  const [practiceGamesPlayed, setPracticeGamesPlayed] = useState(0);
  const [practiceWins, setPracticeWins] = useState(0);
  const [showStrategyInfo, setShowStrategyInfo] = useState(true); // показывать объяснение стратегий
  const [isHumanTurn, setIsHumanTurn] = useState(true);
  const [practiceBoardSize, setPracticeBoardSize] = useState<BoardSize>(3);
  const [practiceBoard, setPracticeBoard] = useState<Player[]>(createEmptyBoard(3));
  const [practiceStatus, setPracticeStatus] = useState<GameStatus>('idle');
  const [practiceWinner, setPracticeWinner] = useState<Winner>(null);
  const [practiceWinningLine, setPracticeWinningLine] = useState<number[] | null>(null);
  const [practiceLastMove, setPracticeLastMove] = useState<number | null>(null);
  const [stepKV, setStepKV] = useKV<number>('mobile-step', 1);
  const step = Number(stepKV ?? 1);
  const setStep = (n: number) => setStepKV(n);

  const odds = calculateOdds(xStrategy, oStrategy);

  useEffect(() => {
    setPlayerNameDraft(playerName);
  }, [playerName]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const replay = parseReplayHash(params.get('replay'));
    const challenge = parseChallengeHash(params.get('challenge'));

    if (replay) {
      setSharedReplay(replay);
      setChallengeInvite(null);
      setStep(6);
      setBattleBoardSize(replay.boardSize);
      setBoard(replay.board);
      setStatus('finished');
      setWinner(replay.winner);
      setWinningLine(replay.winningLine);
      setLastMove(replay.board.reduce((acc, cell, index) => cell ? index : acc, null as number | null));
      setXStrategy(replay.xStrategy);
      setOStrategy(replay.oStrategy);
      setCurrentBet(null);
      return;
    }

    if (challenge) {
      setChallengeInvite(challenge);
      setSharedReplay(null);
      setXStrategy(challenge.xStrategy);
      setOStrategy(challenge.oStrategy);
      setBattleBoardSize(challenge.boardSize);
      setBoard(createEmptyBoard(challenge.boardSize));
      setWinner(null);
      setWinningLine(null);
      setLastMove(null);
      setStatus('idle');
      setCurrentBet(null);
      setStep(4);
    }
  }, []);

  // Названия шагов
  const stepTitles: Record<Language, string[]> = {
    en: ['Language', 'Rules', 'Practice', 'Betting', 'AI Setup', 'Battle!'],
    ru: ['Язык', 'Правила', 'Практика', 'Ставки', 'Настройка', 'Битва!'],
    ar: ['اللغة', 'القواعد', 'التدريب', 'الرهان', 'الإعداد', 'المعركة!'],
    zh: ['语言', '规则', '练习', '投注', '设置', '对战!'],
  };

  const next = () => setStep(Math.min(6, step + 1));
  const prev = () => setStep(Math.max(1, step - 1));

  // Начать игру для практики (Человек vs ИИ)
  const startPracticeGame = () => {
    ensureAudioUnlocked();
    if (gameTimeoutRef.current) {
      clearTimeout(gameTimeoutRef.current);
      gameTimeoutRef.current = null;
    }
    setPracticeBoard(createEmptyBoard(practiceBoardSize));
    setPracticeStatus('playing');
    setPracticeWinner(null);
    setPracticeWinningLine(null);
    setPracticeLastMove(null);
    setIsHumanTurn(true);
    setShowStrategyInfo(false);
  };

  // Ход человека в практике
  const makeHumanMove = (index: number) => {
    if (practiceStatus !== 'playing' || !isHumanTurn || practiceBoard[index]) return;
    
    const newBoard = [...practiceBoard];
    newBoard[index] = 'X';
    setPracticeBoard(newBoard);
    setPracticeLastMove(index);
    playMoveSound(true);
    
    const result = checkWinner(newBoard, practiceBoardSize);
    if (result.winner) {
      setPracticeWinner(result.winner);
      setPracticeWinningLine(result.winningLine);
      setPracticeStatus('finished');
      setPracticeGamesPlayed(g => g + 1);
      recordPracticeGame(practiceAIStrategy);
      if (result.winner === 'X') {
        setPracticeWins(w => w + 1);
        playWinSound(true);
      }
      try { navigator.vibrate?.(result.winner === 'draw' ? 30 : [20, 30, 20]); } catch {}
      return;
    }
    
    // Ход ИИ
    setIsHumanTurn(false);
    
    setTimeout(() => {
      const ai = AI_STRATEGIES[practiceAIStrategy];
      const aiMove = ai.getMove(newBoard, 'O', practiceBoardSize);
      
      // Если ИИ не может сделать ход (все клетки заняты или ошибка)
      if (aiMove === undefined || aiMove === -1 || aiMove >= practiceBoardSize * practiceBoardSize) {
        // Это ничья (не должно происходить если checkWinner работает правильно)
        setPracticeWinner('draw');
        setPracticeWinningLine(null);
        setPracticeStatus('finished');
        setPracticeGamesPlayed(g => g + 1);
        recordPracticeGame(practiceAIStrategy);
        try { navigator.vibrate?.(30); } catch {}
        return;
      }
      
      const aiBoard = [...newBoard];
      aiBoard[aiMove] = 'O';
      setPracticeBoard(aiBoard);
      setPracticeLastMove(aiMove);
      playMoveSound(true);
      
      const aiResult = checkWinner(aiBoard, practiceBoardSize);
      if (aiResult.winner) {
        setPracticeWinner(aiResult.winner);
        setPracticeWinningLine(aiResult.winningLine);
        setPracticeStatus('finished');
        setPracticeGamesPlayed(g => g + 1);
        recordPracticeGame(practiceAIStrategy);
        if (aiResult.winner === 'X') {
          setPracticeWins(w => w + 1);
          playWinSound(true);
        }
        try { navigator.vibrate?.(aiResult.winner === 'draw' ? 30 : [20, 30, 20]); } catch {}
      } else {
        setIsHumanTurn(true);
      }
    }, 500);
  };

  const startGame = () => {
    if (status === 'playing') return;
    ensureAudioUnlocked();
    // Очищаем предыдущий таймер если есть
    if (gameTimeoutRef.current) {
      clearTimeout(gameTimeoutRef.current);
      gameTimeoutRef.current = null;
    }
    setBoard(createEmptyBoard(battleBoardSize));
    setCurrentPlayer('X');
    setStatus('playing');
    setWinner(null);
    setWinningLine(null);
    setLastMove(null);
    setSharedReplay(null);
  };

  const makeAIMove = (currentBoard: Player[], player: Player) => {
    // CRITICAL FIX: Prevent AI from playing in Step 3 (Practice Mode)
    // Step 3 is Human vs AI, handled by makeHumanMove.
    if (step === 3) return;

    const strategy = player === 'X' ? xStrategy : oStrategy;
    const ai = AI_STRATEGIES[strategy];
    const move = ai.getMove(currentBoard, player, battleBoardSize);
    const newBoard = [...currentBoard];
    newBoard[move] = player;
    setBoard(newBoard);
    setLastMove(move);
    playMoveSound(true);
    const result = checkWinner(newBoard, battleBoardSize);
    if (result.winner) {
      setWinner(result.winner);
      setWinningLine(result.winningLine);
      setStatus('finished');
      let resolvedBetResult: BetResult | null = null;
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
        resolvedBetResult = betResult;
        setBetResults([...betResults, betResult]);
        const finalBalance = (balanceBeforeBet ?? balance) - currentBet.amount + payout;
        setBalance(finalBalance);
        setBalanceBeforeBet(null);
        setCurrentBet(null); // Сбрасываем ставку после игры
        if (profit > 0) toast.success(t(language, 'toasts.youWon', { amount: profit.toString() }));
        else if (profit < 0) toast.error(t(language, 'toasts.youLost', { amount: (-profit).toString() }));
        else toast.info(t(language, 'toasts.betReturned'));
      }
      recordBattleResult({
        board: newBoard,
        boardSize: battleBoardSize,
        winner: result.winner,
        winningLine: result.winningLine,
        xStrategy,
        oStrategy,
        predictedOutcome: currentBet ? ((currentBet as any).betType as Player | 'draw') : null,
        betResult: resolvedBetResult,
        xOdds: odds.xOdds,
        oOdds: odds.oOdds,
      });
      playWinSound(true);
    } else {
      setCurrentPlayer(player === 'X' ? 'O' : 'X');
    }
  };

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
    // Сохраняем баланс ДО ставки, но НЕ вычитаем сразу - вычтем после игры
    setBalanceBeforeBet(balance);
    setCurrentBet(bet);
    // НЕ вычитаем баланс сразу - это делается после окончания игры в makeAIMove
    const message = player === 'draw'
      ? t(language, 'toasts.betAcceptedDraw', { amount: amount.toString() })
      : t(language, 'toasts.betAccepted', { amount: amount.toString(), player: String(player) });
    toast.success(message);
    playBetSound(true);
  };

  // Открыть мини-игру для заработка спичек
  const openMathGame = () => {
    const problem = generateMathProblem();
    setMathProblem(problem);
    const wrongAnswers = generateWrongAnswers(problem.answer);
    const allAnswers = [...wrongAnswers, problem.answer].sort(() => Math.random() - 0.5);
    setMathAnswerOptions(allAnswers);
    setMathWorkNotes('');
    setMathResult(null);
    setShowMathGame(true);
  };

  // Проверить ответ
  const checkMathAnswer = (selectedAnswer: number) => {
    if (!mathProblem) return;
    
    const isCorrect = selectedAnswer === mathProblem.answer;
    setMathResult(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
      // Базовая награда + бонус за записи
      const baseReward = 30;
      const notesBonus = mathWorkNotes.trim().length >= 10 ? 20 : 0; // +20 за записи
      const totalReward = baseReward + notesBonus;
      
      setTimeout(() => {
        setBalance(balance + totalReward);
        if (notesBonus > 0) {
          toast.success(
            language === 'ru' 
              ? `🎉 Правильно! +${baseReward} спичек + ${notesBonus} бонус за записи!`
              : `🎉 Correct! +${baseReward} matches + ${notesBonus} bonus for notes!`
          );
        } else {
          toast.success(
            language === 'ru' 
              ? `✅ Правильно! +${baseReward} спичек`
              : `✅ Correct! +${baseReward} matches`
          );
        }
        playEarnSound(true);
        setShowMathGame(false);
      }, 1500);
    } else {
      setTimeout(() => {
        toast.error(
          language === 'ru' 
            ? `❌ Неверно. Правильный ответ: ${mathProblem.answer}`
            : `❌ Wrong. Correct answer: ${mathProblem.answer}`
        );
      }, 500);
    }
  };

  // Старая функция для совместимости (теперь открывает мини-игру)
  const earnMatches = () => {
    openMathGame();
  };

  // Автоматическая игра ИИ vs ИИ (только для шага 6 - Битва)
  useEffect(() => {
    // Авто-игра только на шаге 6 (Битва)
    if (step !== 6) return;
    
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
  }, [status, currentPlayer, board, step]);

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
          <div className="flex flex-col items-end gap-2">
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-purple-500/25">
              <div className="text-xs text-white/70 text-center">{step}/6</div>
              <div className="text-sm font-bold text-white">{stepTitles[language][step - 1]}</div>
            </div>
            {/* Индикатор активной ставки */}
            {currentBet && (
              <div className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-xs text-amber-300 font-medium">
                🎯 {(currentBet as any).betType === 'draw' ? '=' : (currentBet as any).betType} • {currentBet.amount}🪵
              </div>
            )}
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
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
                  <label className="mb-2 block text-sm font-medium text-white">
                    {language === 'ru' ? 'Имя для Hall of Fame' : language === 'ar' ? 'اسمك لقاعة الشهرة' : language === 'zh' ? '你的名人堂昵称' : 'Your Hall of Fame name'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={playerNameDraft}
                      onChange={(event) => setPlayerNameDraft(event.target.value)}
                      placeholder={language === 'ru' ? 'Игрок' : 'Player'}
                      className="h-11 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
                    />
                    <button onClick={() => savePlayerName(playerNameDraft)} className="rounded-xl bg-white/10 px-4 text-sm font-semibold text-white transition-all hover:bg-white/20">
                      OK
                    </button>
                  </div>
                </div>
                {hasVisited && <QuickStartButton language={language} onClick={() => setStep(6)} />}
              </div>
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

          {/* ШАГ 3: Практика - Ты vs ИИ */}
          {step === 3 && (
            <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-5 shadow-2xl">
              {/* Заголовок */}
              <div className="text-center mb-4">
                <div className="w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 
                                flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <span className="text-2xl">🎮</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {language === 'ru' ? 'Ты vs ИИ' : language === 'ar' ? 'أنت ضد الذكاء' : language === 'zh' ? '你 vs AI' : 'You vs AI'}
                </h2>
                <p className="text-white/60 text-xs mt-1">
                  {language === 'ru' ? 'Нажми на клетку, чтобы сделать ход!' : language === 'ar' ? 'انقر على خلية للتحرك!' : language === 'zh' ? '点击格子来走棋！' : 'Tap a cell to make your move!'}
                </p>
              </div>

              {/* Выбор размера поля */}
              {practiceStatus === 'idle' && (
                <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-violet-900/50 to-purple-900/50 border border-violet-500/30">
                  <div className="text-white/80 text-xs mb-2 font-medium text-center">
                    {language === 'ru' ? '📐 Размер поля:' : language === 'ar' ? '📐 حجم اللوحة:' : language === 'zh' ? '📐 棋盘大小：' : '📐 Board size:'}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {([3, 4, 5] as BoardSize[]).map((size) => {
                      const isActive = practiceBoardSize === size;
                      return (
                        <button
                          key={size}
                          onClick={() => {
                            setPracticeBoardSize(size);
                            setPracticeBoard(createEmptyBoard(size));
                          }}
                          className={`p-3 rounded-lg text-center transition-all ${
                            isActive 
                              ? 'bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg scale-105' 
                              : 'bg-black/30 border border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-lg font-bold">{size}×{size}</div>
                          <div className="text-[10px] opacity-70">
                            {size === 3 && (language === 'ru' ? 'Классика' : 'Classic')}
                            {size === 4 && (language === 'ru' ? 'Средний' : 'Medium')}
                            {size === 5 && (language === 'ru' ? 'Большой' : 'Large')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Выбор стратегии ИИ-противника */}
              {practiceStatus === 'idle' && (
                <div className="mb-4 p-3 rounded-xl bg-slate-800/60 border border-slate-600/30">
                  <div className="text-white/80 text-xs mb-2 font-medium">
                    {language === 'ru' ? '🤖 Выбери противника:' : language === 'ar' ? '🤖 اختر خصمك:' : language === 'zh' ? '🤖 选择对手：' : '🤖 Choose opponent:'}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(['random', 'defensive', 'offensive', 'minimax'] as AIStrategy[]).map((strat) => {
                      const isActive = practiceAIStrategy === strat;
                      const icons: Record<AIStrategy, string> = { random: '🎲', defensive: '🛡️', offensive: '⚔️', minimax: '🧠' };
                      const colors: Record<AIStrategy, string> = {
                        random: 'from-rose-500 to-pink-500 border-rose-500/50',
                        defensive: 'from-blue-500 to-cyan-500 border-blue-500/50',
                        offensive: 'from-orange-500 to-amber-500 border-orange-500/50',
                        minimax: 'from-emerald-500 to-green-500 border-emerald-500/50',
                      };
                      return (
                        <button
                          key={strat}
                          onClick={() => setPracticeAIStrategy(strat)}
                          className={`p-2 rounded-lg text-center transition-all ${
                            isActive 
                              ? `bg-gradient-to-br ${colors[strat]} text-white shadow-lg scale-105` 
                              : 'bg-black/30 border border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-xl mb-1">{icons[strat]}</div>
                          <div className="text-[10px] font-medium truncate">
                            {strat === 'random' && (language === 'ru' ? 'Имп.' : language === 'ar' ? 'عشو' : language === 'zh' ? '冲动' : 'Imp.')}
                            {strat === 'defensive' && (language === 'ru' ? 'Обор.' : language === 'ar' ? 'دفا' : language === 'zh' ? '防守' : 'Def.')}
                            {strat === 'offensive' && (language === 'ru' ? 'Наст.' : language === 'ar' ? 'هجو' : language === 'zh' ? '进攻' : 'Off.')}
                            {strat === 'minimax' && (language === 'ru' ? 'Расч.' : language === 'ar' ? 'حسا' : language === 'zh' ? '精算' : 'Calc.')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Игровое поле */}
              <div className="rounded-xl bg-black/30 border border-white/5 p-3 mb-4">
                <GameBoard 
                  board={practiceBoard} 
                  winningLine={practiceWinningLine} 
                  lastMove={practiceLastMove}
                  onCellClick={makeHumanMove}
                  disabled={practiceStatus !== 'playing' || !isHumanTurn}
                  size={practiceBoardSize}
                />
              </div>

              {/* Подсказка хода */}
              {practiceStatus === 'playing' && (
                <div className={`mb-3 p-3 rounded-lg text-center text-sm font-medium ${
                  isHumanTurn 
                    ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 animate-pulse' 
                    : 'bg-pink-500/20 border border-pink-500/30 text-pink-300'
                }`}>
                  {isHumanTurn 
                    ? (language === 'ru' ? '👆 Твой ход! Нажми на клетку' : language === 'ar' ? '👆 دورك! انقر على خلية' : language === 'zh' ? '👆 轮到你了！点击格子' : '👆 Your turn! Tap a cell')
                    : (language === 'ru' ? '🤖 ИИ думает...' : language === 'ar' ? '🤖 الذكاء يفكر...' : language === 'zh' ? '🤖 AI思考中...' : '🤖 AI thinking...')
                  }
                </div>
              )}

              {/* Начальное состояние - призыв к действию */}
              {practiceStatus === 'idle' && (
                <div className="mb-3 p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-center">
                  <span className="text-2xl mb-2 block">🎯</span>
                  <span className="text-white font-medium">
                    {language === 'ru' ? 'Нажми "Начать игру" и кликай на клетки!' : language === 'ar' ? 'اضغط ابدأ وانقر على الخلايا!' : language === 'zh' ? '点击开始游戏，然后点击格子！' : 'Press Start and tap the cells!'}
                  </span>
                </div>
              )}
              
              {/* Результат */}
              {practiceStatus === 'finished' && practiceWinner && (
                <div className={`mb-3 p-4 rounded-xl text-center ${
                  practiceWinner === 'X' 
                    ? 'bg-emerald-500/20 border border-emerald-500/30' 
                    : practiceWinner === 'O'
                      ? 'bg-rose-500/20 border border-rose-500/30'
                      : 'bg-yellow-500/20 border border-yellow-500/30'
                }`}>
                  <span className="text-2xl mr-2">
                    {practiceWinner === 'X' ? '🎉' : practiceWinner === 'O' ? '🤖' : '🤝'}
                  </span>
                  <span className="text-white font-medium">
                    {practiceWinner === 'X' 
                      ? (language === 'ru' ? 'Ты победил!' : language === 'ar' ? 'فزت!' : language === 'zh' ? '你赢了！' : 'You won!')
                      : practiceWinner === 'O'
                        ? (language === 'ru' ? 'ИИ победил' : language === 'ar' ? 'فاز الذكاء' : language === 'zh' ? 'AI赢了' : 'AI won')
                        : (language === 'ru' ? 'Ничья!' : language === 'ar' ? 'تعادل!' : language === 'zh' ? '平局！' : 'Draw!')
                    }
                  </span>
                </div>
              )}

              {/* Статистика */}
              {practiceGamesPlayed > 0 && (
                <div className="mb-3 p-2 rounded-lg bg-white/5 border border-white/10 text-center text-xs text-white/70">
                  {language === 'ru' ? 'Сыграно' : language === 'ar' ? 'لعبت' : language === 'zh' ? '已玩' : 'Played'}: {practiceGamesPlayed} | {language === 'ru' ? 'Побед' : language === 'ar' ? 'انتصارات' : language === 'zh' ? '胜利' : 'Wins'}: {practiceWins}
                </div>
              )}

              {/* Кнопки */}
              <div className="flex gap-3">
                <button 
                  onClick={startPracticeGame} 
                  disabled={practiceStatus === 'playing' && isHumanTurn}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 
                             text-white font-semibold shadow-lg shadow-emerald-500/25
                             disabled:opacity-50 disabled:cursor-not-allowed
                             hover:shadow-emerald-500/40 active:scale-[0.98] transition-all"
                >
                  {practiceStatus === 'playing' 
                    ? (language === 'ru' ? '🎮 Играем...' : language === 'ar' ? '🎮 نلعب...' : language === 'zh' ? '🎮 游戏中...' : '🎮 Playing...')
                    : (language === 'ru' ? '▶ Начать игру' : language === 'ar' ? '▶ ابدأ اللعب' : language === 'zh' ? '▶ 开始游戏' : '▶ Start Game')
                  }
                </button>
                <button 
                  onClick={() => { 
                    setPracticeBoard(createEmptyBoard(practiceBoardSize)); 
                    setPracticeWinner(null); 
                    setPracticeStatus('idle'); 
                    setPracticeWinningLine(null);
                    setPracticeLastMove(null);
                    setIsHumanTurn(true);
                  }} 
                  className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white text-xl
                             hover:bg-white/10 active:scale-95 transition-all"
                >
                  🔄
                </button>
              </div>
              
              {/* Кнопка "Далее" после нескольких игр */}
              {practiceGamesPlayed >= 1 && (
                <button 
                  onClick={next} 
                  className="w-full mt-3 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 
                             text-white font-medium shadow-lg shadow-purple-500/25
                             hover:shadow-purple-500/40 active:scale-[0.98] transition-all"
                >
                  {language === 'ru' ? 'Понятно! Далее →' : language === 'ar' ? 'فهمت! التالي →' : language === 'zh' ? '明白了！下一步 →' : 'Got it! Next →'}
                </button>
              )}
            </div>
          )}

          {/* ШАГ 4: Инвестиции - ОБРАЗОВАТЕЛЬНЫЙ */}
          {step === 4 && (
            <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
              {/* Заголовок */}
              <div className="text-center mb-5">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 
                                flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <span className="text-3xl">📊</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {language === 'ru' ? 'Учимся инвестировать' : language === 'ar' ? 'تعلم الاستثمار' : language === 'zh' ? '学习投资' : 'Learn to Invest'}
                </h2>
                <p className="text-white/70 text-sm leading-relaxed">
                  {language === 'ru' 
                    ? 'Инвестиция — это когда ты вкладываешь ресурсы, надеясь получить больше. Но есть риск потерять!'
                    : language === 'ar' 
                      ? 'الاستثمار هو عندما تضع مواردك أملاً في الحصول على المزيد. لكن هناك خطر الخسارة!'
                      : language === 'zh'
                        ? '投资是指你投入资源，希望获得更多回报。但也有损失的风险！'
                        : 'Investment is when you put in resources hoping to get more. But there\'s risk of losing!'}
                </p>
              </div>
              {challengeInvite && (
                <div className="mb-4 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-4 text-sm text-white">
                  🥊 {challengeInvite.challengerName} {language === 'ru' ? 'вызвал тебя на матч. Стратегии уже загружены — поставь против его выбора.' : language === 'ar' ? 'تحداك في مباراة. الاستراتيجيات جاهزة — راهن عكس اختياره.' : language === 'zh' ? '向你发起挑战。策略已加载，试着押他的反面。' : 'challenged you to this matchup. Strategies are loaded — bet against their pick.'}
                </div>
              )}

              {/* Образовательные карточки */}
              <div className="space-y-3 mb-5">
                {/* Что такое коэффициент */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-cyan-500/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">📈</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-cyan-400 mb-1">
                        {language === 'ru' ? 'Коэффициент (множитель)' : language === 'ar' ? 'المُضاعِف' : language === 'zh' ? '赔率（乘数）' : 'Odds (multiplier)'}
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed">
                        {language === 'ru' 
                          ? 'Показывает, во сколько раз увеличится твоя ставка при выигрыше. Коэффициент 2.0x = удвоение!'
                          : language === 'ar'
                            ? 'يُظهر كم ستتضاعف ستافتك عند الفوز. معامل 2.0x = مضاعفة!'
                            : language === 'zh'
                              ? '显示获胜时你的投注会翻多少倍。2.0倍 = 翻倍！'
                              : 'Shows how many times your bet multiplies when you win. 2.0x = doubling!'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Риск и награда */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-purple-500/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">⚖️</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-purple-400 mb-1">
                        {language === 'ru' ? 'Риск и награда' : language === 'ar' ? 'المخاطرة والمكافأة' : language === 'zh' ? '风险与回报' : 'Risk & Reward'}
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed">
                        {language === 'ru' 
                          ? 'Высокий коэффициент = большая награда, но и больший риск! Низкий = безопаснее, но меньше прибыль.'
                          : language === 'ar'
                            ? 'معامل عالي = مكافأة كبيرة لكن خطر أكبر! منخفض = أكثر أماناً لكن ربح أقل.'
                            : language === 'zh'
                              ? '高赔率 = 高回报，但风险也大！低赔率 = 更安全，但利润少。'
                              : 'High odds = big reward, but more risk! Low = safer, but less profit.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Умный выбор */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-500/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🎯</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-emerald-400 mb-1">
                        {language === 'ru' ? 'Умный выбор' : language === 'ar' ? 'الاختيار الذكي' : language === 'zh' ? '明智选择' : 'Smart Choice'}
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed">
                        {language === 'ru' 
                          ? 'Подумай: какая стратегия сильнее? На неё коэффициент ниже (меньше риск). Анализируй!'
                          : language === 'ar'
                            ? 'فكر: أي استراتيجية أقوى؟ معاملها أقل (خطر أقل). حلل!'
                            : language === 'zh'
                              ? '想一想：哪种策略更强？它的赔率较低（风险小）。要分析！'
                              : 'Think: which strategy is stronger? Its odds are lower (less risk). Analyze!'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Как заработать спички */}
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🧮</span>
                  <span className="font-bold text-green-300">
                    {language === 'ru' ? 'Заработай спички!' : language === 'ar' ? 'اكسب أعواد الثقاب!' : language === 'zh' ? '赚取火柴！' : 'Earn matches!'}
                  </span>
                </div>
                <p className="text-sm text-white/80 mb-3">
                  {language === 'ru' 
                    ? 'Реши пример в уме — получи спички! Запиши ход решения в блокнот — получи бонус!'
                    : language === 'ar'
                      ? 'حل المسألة ذهنياً - احصل على أعواد الثقاب! اكتب خطوات الحل - احصل على مكافأة!'
                      : language === 'zh'
                        ? '心算解题 - 获得火柴！写下解题步骤 - 获得奖励！'
                        : 'Solve in your head — get matches! Write your steps — get bonus!'}
                </p>
                <button 
                  onClick={openMathGame} 
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium
                             hover:from-green-400 hover:to-emerald-400 active:scale-[0.98] transition-all shadow-lg shadow-green-500/25"
                >
                  🧮 {language === 'ru' ? 'Решить пример (+30🪵)' : language === 'ar' ? 'حل المسألة (+30🪵)' : language === 'zh' ? '解题 (+30🪵)' : 'Solve problem (+30🪵)'}
                </button>
              </div>

              {/* Текущий баланс */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🪵</span>
                  <span className="text-white/70 text-sm">{language === 'ru' ? 'Твой баланс:' : 'Your balance:'}</span>
                </div>
                <span className="text-2xl font-bold text-white">{balance}</span>
              </div>

              {/* Панель ставок */}
              <div className="mb-4">
                <h3 className="text-white font-bold text-center mb-3">
                  {language === 'ru' ? '🎯 Сделай свой выбор!' : language === 'ar' ? '🎯 اختر!' : language === 'zh' ? '🎯 做出选择！' : '🎯 Make your choice!'}
                </h3>
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
              </div>
              
              {/* Показываем подтверждение ставки */}
              {currentBet && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {language === 'ru' ? 'Инвестиция сделана!' : language === 'ar' ? 'تم الاستثمار!' : language === 'zh' ? '投资完成！' : 'Investment made!'}
                      </div>
                      <div className="text-sm text-emerald-300/80">
                        {currentBet.amount}🪵 → {(currentBet as any).betType === 'draw' ? '=' : (currentBet as any).betType} 
                        ({language === 'ru' ? 'возможный выигрыш' : 'potential win'}: {Math.round(currentBet.amount * currentBet.odds)}🪵)
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <button 
                onClick={next} 
                className={`w-full h-12 rounded-xl font-medium shadow-lg 
                           active:scale-[0.98] transition-all ${
                  currentBet 
                    ? 'bg-gradient-to-r from-emerald-600 to-green-500 shadow-emerald-500/25 hover:shadow-emerald-500/40'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-500 shadow-violet-500/25 hover:shadow-violet-500/40'
                } text-white`}
              >
                {currentBet 
                  ? (language === 'ru' ? '🔥 К игре!' : language === 'ar' ? '🔥 إلى اللعب!' : language === 'zh' ? '🔥 开始游戏!' : '🔥 Go Play!')
                  : (language === 'ru' ? 'Настроить ИИ' : language === 'ar' ? 'إعداد الذكاء' : language === 'zh' ? '设置AI' : 'Setup AI')
                } →
              </button>
            </div>
          )}

          {/* ШАГ 5: Настройка ИИ - ОБРАЗОВАТЕЛЬНЫЙ */}
          {step === 5 && (
            <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
              {/* Заголовок с объяснением */}
              <div className="text-center mb-5">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 
                                flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <span className="text-3xl">🧠</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {language === 'ru' ? 'Типы мышления' : language === 'ar' ? 'أنواع التفكير' : language === 'zh' ? '思维类型' : 'Ways of Thinking'}
                </h2>
                <p className="text-white/70 text-sm leading-relaxed">
                  {language === 'ru' 
                    ? 'Как мы принимаем решения? Посмотри на 4 типа поведения и подумай — какой даёт лучший результат?'
                    : language === 'ar' 
                      ? 'كيف نتخذ القرارات؟ انظر إلى 4 أنواع من السلوك وفكر - أيها يعطي أفضل نتيجة؟'
                      : language === 'zh'
                        ? '我们如何做决定？看看4种行为类型，想想哪种效果最好？'
                        : 'How do we make decisions? Look at 4 behavior types and think — which gives the best result?'}
                </p>
              </div>

              {/* Карточки стратегий с объяснениями */}
              <div className="space-y-3 mb-5">
                {/* Импульсивный / Без плана */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-yellow-500/30">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-2xl">🎲</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-yellow-400 mb-1">
                        {language === 'ru' ? 'Импульсивная' : language === 'ar' ? 'اندفاعية' : language === 'zh' ? '冲动型' : 'Impulsive'}
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed mb-2">
                        {language === 'ru' 
                          ? 'Нет плана. Решения "на авось". Делает что попало, не думая о последствиях.'
                          : language === 'ar'
                            ? 'بدون خطة. قرارات عشوائية. يفعل أي شيء دون التفكير في العواقب.'
                            : language === 'zh'
                              ? '没有计划。随意决定。不考虑后果就随便做。'
                              : 'No plan. Random decisions. Does whatever without thinking of consequences.'}
                      </p>
                      <p className="text-xs text-yellow-300/80 italic">
                        {language === 'ru' 
                          ? '⚠️ Результат: почти всегда проигрыш. Удача не заменит план!'
                          : language === 'ar'
                            ? '⚠️ النتيجة: خسارة شبه دائمة. الحظ لا يحل محل الخطة!'
                            : language === 'zh'
                              ? '⚠️ 结果：几乎总是输。运气代替不了计划！'
                              : '⚠️ Result: almost always loses. Luck won\'t replace a plan!'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Оборонительный */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-2xl">🛡️</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-blue-400 mb-1">
                        {language === 'ru' ? 'Оборонительная' : language === 'ar' ? 'دفاعية' : language === 'zh' ? '防守型' : 'Defensive'}
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed mb-2">
                        {language === 'ru' 
                          ? 'Только защищается. Боится рисковать. Реагирует на чужие действия, но сам не создаёт возможности.'
                          : language === 'ar'
                            ? 'يدافع فقط. يخاف المخاطرة. يتفاعل مع أفعال الآخرين ولا يخلق فرصاً.'
                            : language === 'zh'
                              ? '只防守。害怕冒险。只会应对别人，不会创造机会。'
                              : 'Only defends. Afraid to risk. Reacts to others but doesn\'t create opportunities.'}
                      </p>
                      <p className="text-xs text-blue-300/80 italic">
                        {language === 'ru' 
                          ? '⚠️ Результат: не проигрывает сразу, но редко побеждает. Выживание ≠ победа.'
                          : language === 'ar'
                            ? '⚠️ النتيجة: لا يخسر فوراً لكن نادراً ما يفوز. البقاء ≠ الفوز.'
                            : language === 'zh'
                              ? '⚠️ 结果：不会马上输，但很少赢。生存 ≠ 胜利。'
                              : '⚠️ Result: doesn\'t lose immediately, but rarely wins. Survival ≠ victory.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Агрессор */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-red-500/30">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-2xl">⚔️</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-red-400 mb-1">
                        {language === 'ru' ? 'Наступательная' : language === 'ar' ? 'هجومية' : language === 'zh' ? '进攻型' : 'Offensive'}
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed mb-2">
                        {language === 'ru' 
                          ? 'Только атакует. Игнорирует угрозы. Хочет победить любой ценой, забывая о защите.'
                          : language === 'ar'
                            ? 'يهاجم فقط. يتجاهل التهديدات. يريد الفوز بأي ثمن ناسياً الدفاع.'
                            : language === 'zh'
                              ? '只进攻。忽视威胁。不惜一切代价想赢，忘记防守。'
                              : 'Only attacks. Ignores threats. Wants to win at any cost, forgetting defense.'}
                      </p>
                      <p className="text-xs text-red-300/80 italic">
                        {language === 'ru' 
                          ? '⚠️ Результат: иногда побеждает, но часто проигрывает из-за слепых зон.'
                          : language === 'ar'
                            ? '⚠️ النتيجة: يفوز أحياناً لكن غالباً يخسر بسبب النقاط العمياء.'
                            : language === 'zh'
                              ? '⚠️ 结果：有时赢，但经常因为盲点而输。'
                              : '⚠️ Result: sometimes wins, but often loses due to blind spots.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Взвешенный / Продуманный */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-500/30">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-2xl">🧩</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-emerald-400 mb-1">
                        {language === 'ru' ? 'Расчётливая' : language === 'ar' ? 'محسوبة' : language === 'zh' ? '精打细算' : 'Calculated'}
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed mb-2">
                        {language === 'ru' 
                          ? 'Думает наперёд. Взвешивает все варианты. Расчёт важнее импульсов. Предусмотрительность и здравомыслие.'
                          : language === 'ar'
                            ? 'يفكر مسبقاً. يزن كل الخيارات. الحساب أهم من الاندفاع. التبصر والحكمة.'
                            : language === 'zh'
                              ? '提前思考。权衡所有选项。计算比冲动重要。深谋远虑，理性思考。'
                              : 'Thinks ahead. Weighs all options. Calculation over impulse. Foresight and wisdom.'}
                      </p>
                      <p className="text-xs text-emerald-300/80 italic">
                        {language === 'ru' 
                          ? '✅ Результат: побеждает ЧАЩЕ всех. Вот что даёт продуманность!'
                          : language === 'ar'
                            ? '✅ النتيجة: يفوز أكثر من غيره. هذا ما يمنحه التخطيط!'
                            : language === 'zh'
                              ? '✅ 结果：赢得最多。这就是深思熟虑的力量！'
                              : '✅ Result: wins MORE often. That\'s what thinking ahead gives you!'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Вопрос для размышления */}
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">💡</span>
                  <span className="font-bold text-purple-300">
                    {language === 'ru' ? 'Подумай!' : language === 'ar' ? 'فكر!' : language === 'zh' ? '想一想！' : 'Think about it!'}
                  </span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">
                  {language === 'ru' 
                    ? 'В жизни тоже так! Импульсивность ведёт к ошибкам. Только оборона — к застою. Агрессия — к конфликтам. А продуманность — к успеху!'
                    : language === 'ar'
                      ? 'الحياة أيضاً هكذا! الاندفاع يؤدي للأخطاء. الدفاع فقط يؤدي للجمود. العدوانية للصراعات. والتخطيط للنجاح!'
                      : language === 'zh'
                        ? '生活也是如此！冲动导致错误。只防守会停滞。攻击性导致冲突。而深思熟虑带来成功！'
                        : 'Life is the same! Impulsivity leads to mistakes. Defense only leads to stagnation. Aggression to conflicts. And strategic thinking — to success!'}
                </p>
              </div>

              {/* Выбор стратегий */}
              <div className="space-y-3 mb-5">
                <h3 className="text-white font-bold text-center">
                  {language === 'ru' ? '⚡ Выбери стратегии для боя!' : language === 'ar' ? '⚡ اختر الاستراتيجيات!' : language === 'zh' ? '⚡ 选择对战策略！' : '⚡ Pick strategies for battle!'}
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-white font-bold">X</div>
                      <span className="text-white font-semibold">{t(language, 'xPlayer')}</span>
                    </div>
                    <StrategySelect player="X" strategy={xStrategy} onStrategyChange={setXStrategy} disabled={status==='playing'} language={language} />
                  </div>
                  
                  <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center text-white font-bold">O</div>
                      <span className="text-white font-semibold">{t(language, 'oPlayer')}</span>
                    </div>
                    <StrategySelect player="O" strategy={oStrategy} onStrategyChange={setOStrategy} disabled={status==='playing'} language={language} />
                  </div>
                </div>
              </div>

              {/* Скорость */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⚡</span>
                  <span className="text-white font-medium text-sm">{t(language, 'gameSpeed')}</span>
                </div>
                <SpeedControl speed={speed} onSpeedChange={setSpeed} disabled={status==='playing'} language={language} />
              </div>
              
              <button 
                onClick={next} 
                className="w-full h-14 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 
                           text-white font-semibold text-lg shadow-lg shadow-red-500/25
                           hover:shadow-red-500/40 active:scale-[0.98] transition-all"
              >
                🔥 {language === 'ru' ? 'Смотреть бой!' : language === 'ar' ? 'شاهد المعركة!' : language === 'zh' ? '观看对战！' : 'Watch the battle!'}
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
                {/* Выбор размера поля */}
                <div className="flex justify-center gap-2 mb-3">
                  {[3,4,5].map(s => (
                    <button 
                      key={s} 
                      onClick={() => { setBattleBoardSize(s as BoardSize); setBoard(createEmptyBoard(s as BoardSize)); setStatus('idle'); setWinner(null); setWinningLine(null); setLastMove(null); }}
                      disabled={status==='playing'}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        battleBoardSize===s ? 'bg-rose-600 text-white shadow' : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {s}×{s}
                    </button>
                  ))}
                </div>
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
                <GameBoard board={board} winningLine={winningLine} lastMove={lastMove} size={battleBoardSize} />
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
              {sharedReplay && (
                <div className="mb-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-white">
                  🔁 {sharedReplay.playerName} {language === 'ru' ? 'поделился replay этой битвы.' : language === 'ar' ? 'شارك إعادة هذه المعركة.' : language === 'zh' ? '分享了这场对战回放。' : 'shared this replay with you.'}
                </div>
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
                  onClick={() => { setBoard(createEmptyBoard(battleBoardSize)); setWinner(null); setStatus('idle'); setCurrentBet(null); setSharedReplay(null); }} 
                  className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 text-white text-xl
                             hover:bg-white/10 active:scale-95 transition-all"
                >
                  🔄
                </button>
              </div>
              <div className="mt-4">
                <SharePanel language={language} summary={shareSummary} challengeName={challengeInvite?.challengerName} onSaveCard={saveReplayCardAsImage} />
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

      <div className="mt-6 space-y-4">
        <HallOfFameCard language={language} leaderboard={leaderboard} gamesPlayed={gamesPlayed} streak={streak} />
        <DailyChallengeCard
          language={language}
          challenge={dailyChallenge}
          result={dailyResult}
          onLoad={() => {
            setBattleBoardSize(dailyChallenge.boardSize);
            setXStrategy(dailyChallenge.xStrategy);
            setOStrategy(dailyChallenge.oStrategy);
            setBoard(createEmptyBoard(dailyChallenge.boardSize));
            setWinner(null);
            setWinningLine(null);
            setLastMove(null);
            setStatus('idle');
            setCurrentBet(null);
            setStep(4);
          }}
        />
        <AchievementsCard language={language} achievements={achievements} />
      </div>

      {/* Модальное окно: Мини-игра "Заработай спички" */}
      <AnimatePresence>
        {showMathGame && mathProblem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => !mathResult && setShowMathGame(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 p-6 shadow-2xl"
            >
              {/* Заголовок */}
              <div className="text-center mb-5">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 
                                flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🧮</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {language === 'ru' ? 'Реши в уме!' : language === 'ar' ? 'احسب ذهنياً!' : language === 'zh' ? '心算！' : 'Mental Math!'}
                </h2>
                <p className="text-white/60 text-sm">
                  {language === 'ru' 
                    ? 'Правильный ответ = +30 спичек' 
                    : 'Correct answer = +30 matches'}
                </p>
              </div>

              {/* Задача */}
              <div className="p-4 rounded-xl bg-white/10 border border-white/20 mb-4 text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {mathProblem.question}
                </div>
              </div>

              {/* Блокнот для записей */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📝</span>
                  <span className="text-white/80 text-sm font-medium">
                    {language === 'ru' ? 'Игровой блокнот (бонус +20🪵)' : 'Work notes (bonus +20🪵)'}
                  </span>
                </div>
                <textarea
                  value={mathWorkNotes}
                  onChange={(e) => setMathWorkNotes(e.target.value)}
                  placeholder={language === 'ru' 
                    ? 'Напиши, как ты решал...\nНапример: 47 + 28 = 47 + 30 - 2 = 77 - 2 = 75' 
                    : 'Write how you solved it...'}
                  className="w-full h-20 p-3 rounded-xl bg-slate-700/50 border border-white/10 text-white text-sm 
                             placeholder:text-white/30 resize-none focus:outline-none focus:border-emerald-500/50"
                  disabled={!!mathResult}
                />
                {mathWorkNotes.trim().length >= 10 && !mathResult && (
                  <p className="text-xs text-emerald-400 mt-1">
                    ✓ {language === 'ru' ? 'Бонус за записи активирован!' : 'Notes bonus activated!'}
                  </p>
                )}
              </div>

              {/* Результат */}
              {mathResult && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`p-4 rounded-xl mb-4 text-center ${
                    mathResult === 'correct' 
                      ? 'bg-emerald-500/20 border border-emerald-500/40' 
                      : 'bg-red-500/20 border border-red-500/40'
                  }`}
                >
                  <span className="text-4xl mb-2 block">
                    {mathResult === 'correct' ? '🎉' : '😔'}
                  </span>
                  <span className={`text-lg font-bold ${
                    mathResult === 'correct' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {mathResult === 'correct' 
                      ? (language === 'ru' ? 'Правильно!' : 'Correct!') 
                      : (language === 'ru' ? `Ответ: ${mathProblem.answer}` : `Answer: ${mathProblem.answer}`)}
                  </span>
                </motion.div>
              )}

              {/* Варианты ответов */}
              {!mathResult && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {mathAnswerOptions.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => checkMathAnswer(option)}
                      className="h-14 rounded-xl bg-white/10 border border-white/20 text-white text-xl font-bold
                                 hover:bg-white/20 hover:border-white/30 active:scale-95 transition-all"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Кнопки */}
              <div className="flex gap-3">
                {!mathResult && (
                  <button
                    onClick={() => setShowMathGame(false)}
                    className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 text-white/70 font-medium
                               hover:bg-white/10 active:scale-95 transition-all"
                  >
                    {language === 'ru' ? 'Отмена' : 'Cancel'}
                  </button>
                )}
                {mathResult === 'wrong' && (
                  <button
                    onClick={openMathGame}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium
                               hover:from-amber-400 hover:to-orange-400 active:scale-95 transition-all"
                  >
                    🔄 {language === 'ru' ? 'Ещё задача' : 'Try again'}
                  </button>
                )}
              </div>

              {/* Подсказка */}
              {!mathResult && (
                <p className="text-center text-white/40 text-xs mt-4">
                  💡 {language === 'ru' ? 'Подсказка: ' : 'Hint: '}{mathProblem.hint}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AchievementPopup achievement={activeAchievement} onClose={dismissAchievement} />
    </div>
  );
}
