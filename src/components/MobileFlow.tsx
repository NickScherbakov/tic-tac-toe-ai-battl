import { useState } from 'react';
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

// Иконки шагов
const STEP_ICONS = ['🌍', '📖', '🎮', '🎰', '🤖', '⚔️'];
const STEP_COLORS = [
  'from-blue-500 to-cyan-400',
  'from-amber-500 to-orange-400', 
  'from-green-500 to-emerald-400',
  'from-purple-500 to-pink-400',
  'from-indigo-500 to-violet-400',
  'from-red-500 to-rose-400',
];

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

  // Названия шагов
  const stepTitles: Record<Language, string[]> = {
    en: ['Language', 'Rules', 'Practice', 'Betting', 'AI Setup', 'Battle!'],
    ru: ['Язык', 'Правила', 'Практика', 'Ставки', 'Настройка ИИ', 'Битва!'],
    ar: ['اللغة', 'القواعد', 'التدريب', 'الرهان', 'إعداد الذكاء', 'المعركة!'],
    zh: ['语言', '规则', '练习', '投注', 'AI设置', '对战!'],
  };

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
    <div className="min-h-screen arena-bg p-4 pb-8">
      {/* Красивый заголовок с балансом */}
      <Card className="p-4 mb-4 glass-card border-0 shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪵</span>
            <div>
              <div className="text-xs text-muted-foreground">{t(language, 'balance')}</div>
              <div className="text-xl font-bold text-white">{balance}</div>
            </div>
          </div>
          <Badge 
            className={`px-3 py-1.5 text-sm font-semibold bg-gradient-to-r ${STEP_COLORS[step - 1]} text-white border-0`}
          >
            {STEP_ICONS[step - 1]} {stepTitles[language][step - 1]}
          </Badge>
        </div>

        {/* Улучшенный прогресс-бар со шагами */}
        <div className="flex gap-1.5 mb-3">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                s === step 
                  ? `bg-gradient-to-r ${STEP_COLORS[s - 1]} shadow-lg` 
                  : s < step 
                    ? 'bg-green-500/70' 
                    : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Навигация */}
        <div className="flex justify-between items-center gap-3">
          <Button 
            onClick={prev} 
            variant="outline" 
            disabled={step === 1}
            className="flex-1 h-12 text-lg font-semibold border-2 hover:bg-white/10"
          >
            ← {step > 1 ? stepTitles[language][step - 2] : ''}
          </Button>
          <div className="text-center px-4">
            <div className="text-2xl">{STEP_ICONS[step - 1]}</div>
            <div className="text-xs text-muted-foreground">{step}/6</div>
          </div>
          <Button 
            onClick={next} 
            variant="outline" 
            disabled={step === 6}
            className="flex-1 h-12 text-lg font-semibold border-2 hover:bg-white/10"
          >
            {step < 6 ? stepTitles[language][step] : ''} →
          </Button>
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
          {/* ШАГ 1: Выбор языка */}
          {step === 1 && (
            <Card className="p-6 glass-card border-0 shadow-xl">
              <div className="text-center mb-6">
                <span className="text-5xl mb-3 block">🌍</span>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {language === 'ru' ? 'Выберите язык' : language === 'ar' ? 'اختر اللغة' : language === 'zh' ? '选择语言' : 'Choose Your Language'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {language === 'ru' ? 'Это можно изменить в любой момент' : language === 'ar' ? 'يمكنك تغييره في أي وقت' : language === 'zh' ? '您可以随时更改' : 'You can change this anytime'}
                </p>
              </div>
              <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} childMode={true} />
              <div className="mt-6 text-center">
                <Button 
                  onClick={next} 
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500"
                >
                  {language === 'ru' ? 'Далее →' : language === 'ar' ? 'التالي ←' : language === 'zh' ? '下一步 →' : 'Next →'}
                </Button>
              </div>
            </Card>
          )}

          {/* ШАГ 2: Правила игры */}
          {step === 2 && (
            <Card className="p-6 glass-card border-0 shadow-xl">
              <div className="text-center mb-4">
                <span className="text-5xl mb-3 block">📖</span>
                <h2 className="text-2xl font-bold text-white">{t(language, 'rulesTitle') ?? 'Rules'}</h2>
              </div>
              
              <div className="space-y-4">
                {/* Цель */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <div className="font-semibold text-green-400 text-sm mb-1">
                      {language === 'ru' ? 'Цель' : language === 'ar' ? 'الهدف' : language === 'zh' ? '目标' : 'Goal'}
                    </div>
                    <p className="text-sm text-white/90">{t(language, 'rules.goal')}</p>
                  </div>
                </div>
                
                {/* Как играть */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                  <span className="text-2xl">👆</span>
                  <div>
                    <div className="font-semibold text-blue-400 text-sm mb-1">
                      {language === 'ru' ? 'Как играть' : language === 'ar' ? 'كيف تلعب' : language === 'zh' ? '如何游玩' : 'How to Play'}
                    </div>
                    <p className="text-sm text-white/90">{t(language, 'rules.howToPlay')}</p>
                  </div>
                </div>
                
                {/* Победа */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <div className="font-semibold text-amber-400 text-sm mb-1">
                      {language === 'ru' ? 'Победные линии' : language === 'ar' ? 'خطوط الفوز' : language === 'zh' ? '胜利条件' : 'Win Lines'}
                    </div>
                    <p className="text-sm text-white/90">{t(language, 'rules.winLines')}</p>
                  </div>
                </div>
                
                {/* Ставки */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <span className="text-2xl">🎰</span>
                  <div>
                    <div className="font-semibold text-purple-400 text-sm mb-1">
                      {language === 'ru' ? 'Ставки' : language === 'ar' ? 'الرهان' : language === 'zh' ? '投注' : 'Betting'}
                    </div>
                    <p className="text-sm text-white/90">{t(language, 'rules.betting')}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button 
                  onClick={next} 
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500"
                >
                  {language === 'ru' ? 'Попробовать →' : language === 'ar' ? 'جرب ←' : language === 'zh' ? '试试看 →' : 'Try it →'}
                </Button>
              </div>
            </Card>
          )}

          {/* ШАГ 3: Практика */}
          {step === 3 && (
            <Card className="p-6 glass-card border-0 shadow-xl">
              <div className="text-center mb-4">
                <span className="text-4xl mb-2 block">🎮</span>
                <h2 className="text-xl font-bold text-white">
                  {language === 'ru' ? 'Попробуйте игру!' : language === 'ar' ? 'جرب اللعبة!' : language === 'zh' ? '试试游戏!' : 'Try the Game!'}
                </h2>
                <p className="text-muted-foreground text-xs mt-1">
                  {language === 'ru' ? 'Нажмите "Начать" чтобы увидеть как играют ИИ' : language === 'ar' ? 'اضغط ابدأ لمشاهدة الذكاء الاصطناعي' : language === 'zh' ? '点击开始观看AI对战' : 'Press Start to watch AIs play'}
                </p>
              </div>
              
              <div className="bg-black/20 rounded-xl p-3 mb-4">
                <GameBoard board={board} winningLine={winningLine} lastMove={lastMove} />
              </div>
              
              {status === 'finished' && winner && (
                <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-center">
                  <span className="text-2xl mr-2">🎉</span>
                  <span className="text-white font-semibold">
                    {winner === 'draw' ? t(language, 'drawResult') : t(language, 'playerWins', { player: String(winner) })}
                  </span>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button 
                  onClick={startGame} 
                  disabled={status === 'playing'} 
                  className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500"
                >
                  {status === 'playing' ? '⏳ ' + t(language, 'playing') : '▶️ ' + t(language, 'startGame')}
                </Button>
                <Button 
                  onClick={() => { setBoard(Array(9).fill(null)); setWinner(null); setStatus('idle'); setCurrentBet(null); }} 
                  variant="outline" 
                  className="h-14 px-4 border-2"
                >
                  🔄
                </Button>
              </div>
              
              {status === 'finished' && (
                <Button 
                  onClick={next} 
                  className="w-full h-12 mt-3 text-base font-semibold bg-gradient-to-r from-purple-500 to-pink-400"
                >
                  {language === 'ru' ? 'Перейти к ставкам →' : language === 'ar' ? 'انتقل إلى الرهان ←' : language === 'zh' ? '去投注 →' : 'Go to Betting →'}
                </Button>
              )}
            </Card>
          )}

          {/* ШАГ 4: Ставки */}
          {step === 4 && (
            <Card className="p-6 glass-card border-0 shadow-xl">
              <div className="text-center mb-4">
                <span className="text-4xl mb-2 block">🎰</span>
                <h2 className="text-xl font-bold text-white">{t(language, 'betting')}</h2>
                <p className="text-muted-foreground text-xs mt-1">
                  {language === 'ru' ? 'Выберите победителя и сумму ставки' : language === 'ar' ? 'اختر الفائز ومبلغ الرهان' : language === 'zh' ? '选择获胜者和投注金额' : 'Choose winner and bet amount'}
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
                <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚠️</span>
                      <span className="text-sm text-amber-200">{t(language, 'lowBalance')}</span>
                    </div>
                    <Button size="sm" onClick={earnMatches} className="bg-amber-500 hover:bg-amber-600 text-white">
                      +50 🪵
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <Button 
                  onClick={next} 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-500 to-violet-400"
                >
                  {language === 'ru' ? 'Настроить ИИ →' : language === 'ar' ? 'إعداد الذكاء ←' : language === 'zh' ? '设置AI →' : 'Setup AI →'}
                </Button>
              </div>
            </Card>
          )}

          {/* ШАГ 5: Настройка ИИ */}
          {step === 5 && (
            <Card className="p-6 glass-card border-0 shadow-xl">
              <div className="text-center mb-4">
                <span className="text-4xl mb-2 block">🤖</span>
                <h2 className="text-xl font-bold text-white">
                  {language === 'ru' ? 'Настройка ИИ' : language === 'ar' ? 'إعداد الذكاء الاصطناعي' : language === 'zh' ? 'AI设置' : 'AI Setup'}
                </h2>
                <p className="text-muted-foreground text-xs mt-1">
                  {language === 'ru' ? 'Выберите стратегии для каждого игрока' : language === 'ar' ? 'اختر استراتيجية لكل لاعب' : language === 'zh' ? '为每个玩家选择策略' : 'Choose strategy for each player'}
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-cyan-400">X</span>
                    <span className="text-white font-semibold">{t(language, 'xPlayer')}</span>
                  </div>
                  <StrategySelect player="X" strategy={xStrategy} onStrategyChange={setXStrategy} disabled={status==='playing'} language={language} />
                </div>
                
                <div className="p-4 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-pink-400">O</span>
                    <span className="text-white font-semibold">{t(language, 'oPlayer')}</span>
                  </div>
                  <StrategySelect player="O" strategy={oStrategy} onStrategyChange={setOStrategy} disabled={status==='playing'} language={language} />
                </div>
                
                <Separator className="my-4 bg-white/10" />
                
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-500/20 to-gray-500/20 border border-slate-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">⚡</span>
                    <span className="text-white font-semibold">{t(language, 'gameSpeed')}</span>
                  </div>
                  <SpeedControl speed={speed} onSpeedChange={setSpeed} disabled={status==='playing'} language={language} />
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  onClick={next} 
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-red-500 to-rose-400 hover:from-red-600 hover:to-rose-500"
                >
                  ⚔️ {language === 'ru' ? 'Начать битву!' : language === 'ar' ? 'ابدأ المعركة!' : language === 'zh' ? '开始对战!' : 'Start Battle!'}
                </Button>
              </div>
            </Card>
          )}

          {/* ШАГ 6: Битва ИИ */}
          {step === 6 && (
            <Card className="p-6 glass-card border-0 shadow-xl">
              <div className="text-center mb-4">
                <span className="text-4xl mb-2 block">⚔️</span>
                <h2 className="text-xl font-bold text-white">
                  {language === 'ru' ? 'Битва ИИ!' : language === 'ar' ? 'معركة الذكاء الاصطناعي!' : language === 'zh' ? 'AI对战!' : 'AI Battle!'}
                </h2>
                <div className="flex justify-center items-center gap-3 mt-2">
                  <Badge className="bg-cyan-500/30 text-cyan-300 border-cyan-500/50">
                    X: {t(language, `strategies.${xStrategy}` as any)}
                  </Badge>
                  <span className="text-muted-foreground">vs</span>
                  <Badge className="bg-pink-500/30 text-pink-300 border-pink-500/50">
                    O: {t(language, `strategies.${oStrategy}` as any)}
                  </Badge>
                </div>
              </div>
              
              <div className="bg-black/20 rounded-xl p-3 mb-4">
                <GameBoard board={board} winningLine={winningLine} lastMove={lastMove} />
              </div>
              
              {status === 'finished' && winner && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-4 p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-center"
                >
                  <span className="text-3xl mr-2">🎉</span>
                  <span className="text-lg text-white font-semibold">
                    {winner === 'draw' ? t(language, 'drawResult') : t(language, 'playerWins', { player: String(winner) })}
                  </span>
                </motion.div>
              )}
              
              <div className="flex gap-3">
                <Button 
                  onClick={startGame} 
                  disabled={status === 'playing'} 
                  className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-red-500 to-rose-400 hover:from-red-600 hover:to-rose-500"
                >
                  {status === 'playing' ? '⏳ ' + t(language, 'playing') : '⚔️ ' + t(language, 'startGame')}
                </Button>
                <Button 
                  onClick={() => { setBoard(Array(9).fill(null)); setWinner(null); setStatus('idle'); setCurrentBet(null); }} 
                  variant="outline" 
                  className="h-14 px-4 border-2"
                >
                  🔄
                </Button>
              </div>
              
              {/* Быстрые действия */}
              <div className="mt-4 flex gap-2">
                <Button 
                  onClick={() => setStep(4)} 
                  variant="outline" 
                  size="sm"
                  className="flex-1 text-xs"
                >
                  🎰 {t(language, 'betting')}
                </Button>
                <Button 
                  onClick={() => setStep(5)} 
                  variant="outline" 
                  size="sm"
                  className="flex-1 text-xs"
                >
                  🤖 {language === 'ru' ? 'Изменить ИИ' : language === 'ar' ? 'تغيير الذكاء' : language === 'zh' ? '更改AI' : 'Change AI'}
                </Button>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
