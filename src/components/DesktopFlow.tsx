import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKV } from '@github/spark/hooks';
import { GameBoard } from '@/components/GameBoard';
import { StrategySelect } from '@/components/StrategySelect';
import { BettingPanel } from '@/components/BettingPanel';
import { SpeedControl, GameSpeed, getSpeedDelay } from '@/components/SpeedControl';
import { Player, GameStatus, Winner, BoardSize, checkWinner, createEmptyBoard } from '@/lib/game';
import { AIStrategy, AI_STRATEGIES } from '@/lib/ai';
import { Bet, BetResult, calculateOdds, calculatePayout, createBet } from '@/lib/betting';
import { ensureAudioUnlocked, playBetSound, playEarnSound, playMoveSound, playWinSound } from '@/lib/sound';
import { Language, t } from '@/lib/i18n';
import { toast } from 'sonner';

// Desktop пошаговый флоу (аналог MobileFlow, но без изменений мобильной версии)
// Шаги: 1) Язык, 2) Правила, 3) Практика (человек vs ИИ, выбор размера), 4) Ставки (обучение),
// 5) Настройка ИИ (стратегии + скорость), 6) Битва ИИ vs ИИ.

export function DesktopFlow() {
  // Общий стейт (используем те же ключи что и десктоп ранее где возможно)
  const [languageKV, setLanguageKV] = useKV<Language>('language', 'en');
  const language = languageKV ?? 'en';
  const setLanguage = (l: Language) => setLanguageKV(l);

  // Бой ИИ vs ИИ
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [status, setStatus] = useState<GameStatus>('idle');
  const [winner, setWinner] = useState<Winner>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [lastMove, setLastMove] = useState<number | null>(null);
  const gameTimeoutRef = useRef<number | null>(null);

  const [xStrategy, setXStrategy] = useKV<AIStrategy>('x-strategy', 'minimax');
  const [oStrategy, setOStrategy] = useKV<AIStrategy>('o-strategy', 'random');
  const [speed, setSpeed] = useKV<GameSpeed>('game-speed', 'normal');

  // Ставки
  const [balanceKV, setBalanceKV] = useKV<number>('balance', 100);
  const balance = balanceKV ?? 100;
  const setBalance = (n: number) => setBalanceKV(n);
  const [currentBetKV, setCurrentBetKV] = useKV<Bet | null>('current-bet', null);
  const currentBet = currentBetKV ?? null;
  const setCurrentBet = (b: Bet | null) => setCurrentBetKV(b);
  const [betResultsKV, setBetResultsKV] = useKV<BetResult[]>('bet-results', []);
  const betResults = betResultsKV ?? [];
  const setBetResults = (arr: BetResult[]) => setBetResultsKV(arr);
  const [balanceBeforeBet, setBalanceBeforeBet] = useState<number | null>(null);

  // Шаги флоу
  const [stepKV, setStepKV] = useKV<number>('desktop-step', 1);
  const step = Number(stepKV ?? 1);
  const setStep = (n: number) => setStepKV(n);
  const next = () => setStep(Math.min(6, step + 1));
  const prev = () => setStep(Math.max(1, step - 1));

  // Практика (человек vs ИИ)
  const [practiceAIStrategy, setPracticeAIStrategy] = useState<AIStrategy>('random');
  const [practiceGamesPlayed, setPracticeGamesPlayed] = useState(0);
  const [practiceWins, setPracticeWins] = useState(0);
  const [practiceBoardSize, setPracticeBoardSize] = useState<BoardSize>(3);
  const [practiceBoard, setPracticeBoard] = useState<Player[]>(createEmptyBoard(3));
  const [practiceStatus, setPracticeStatus] = useState<GameStatus>('idle');
  const [practiceWinner, setPracticeWinner] = useState<Winner>(null);
  const [practiceWinningLine, setPracticeWinningLine] = useState<number[] | null>(null);
  const [practiceLastMove, setPracticeLastMove] = useState<number | null>(null);
  const [isHumanTurn, setIsHumanTurn] = useState(true);

  const odds = calculateOdds(xStrategy ?? 'minimax', oStrategy ?? 'random');

  // Запуск игры (AI vs AI)
  const startAIBattle = () => {
    ensureAudioUnlocked();
    if (status === 'playing') return;
    if (!currentBet) {
      toast.error(t(language, 'toasts.placeBetFirst'));
      return;
    }
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setStatus('playing');
    setWinner(null);
    setWinningLine(null);
    setLastMove(null);
  };

  const resetAIBattle = () => {
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

  // Ход ИИ (битва)
  const makeAIMove = (currentBoard: Player[], player: Player) => {
    const strat = player === 'X' ? (xStrategy ?? 'minimax') : (oStrategy ?? 'random');
    const ai = AI_STRATEGIES[strat];
    const move = ai.getMove(currentBoard, player);
    if (move === -1 || move === undefined) {
      // Ничья
      setWinner('draw');
      setStatus('finished');
      return;
    }
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
      // Ставка
      if (currentBet) {
        const betType = (currentBet as any).betType as Player | 'draw';
        let payout = 0; let profit = 0;
        if (betType === 'draw') {
          if (result.winner === 'draw') { payout = Math.round(currentBet.amount * odds.drawOdds); profit = payout - currentBet.amount; }
          else { profit = -currentBet.amount; }
        } else {
          payout = calculatePayout(currentBet, result.winner);
          profit = payout - currentBet.amount;
        }
        const betResult: BetResult = { ...currentBet, winner: result.winner, profit };
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

  useEffect(() => {
    if (status === 'playing' && currentPlayer) {
      const delay = getSpeedDelay(speed ?? 'normal');
      gameTimeoutRef.current = window.setTimeout(() => {
        makeAIMove(board, currentPlayer);
      }, delay);
      return () => { if (gameTimeoutRef.current) clearTimeout(gameTimeoutRef.current); };
    }
  }, [status, currentPlayer, board, speed]);

  // Ставка
  const placeBet = (player: Player | 'draw', amount: number, betOdds: number) => {
    ensureAudioUnlocked();
    if (amount > balance) { toast.error(t(language, 'toasts.insufficientMatches')); return; }
    const bet = createBet(player === 'draw' ? 'X' : player, amount, betOdds); (bet as any).betType = player;
    setCurrentBet(bet); setBalance(balance - amount); setBalanceBeforeBet(balance);
    playBetSound(true);
    toast.success(player === 'draw' ? t(language, 'toasts.betAcceptedDraw', { amount: amount.toString() }) : t(language, 'toasts.betAccepted', { amount: amount.toString(), player }));
  };

  const earnMatches = () => { ensureAudioUnlocked(); const ADD = 50; setBalance(balance + ADD); playEarnSound(true); toast.success(t(language, 'toasts.matchesEarned', { amount: ADD.toString() })); };

  // Практика: старт
  const startPracticeGame = () => {
    ensureAudioUnlocked();
    setPracticeBoard(createEmptyBoard(practiceBoardSize));
    setPracticeStatus('playing');
    setPracticeWinner(null);
    setPracticeWinningLine(null);
    setPracticeLastMove(null);
    setIsHumanTurn(true);
  };

  // Ход человека
  const makeHumanMove = (index: number) => {
    if (practiceStatus !== 'playing' || !isHumanTurn || practiceBoard[index]) return;
    const newBoard = [...practiceBoard]; newBoard[index] = 'X';
    setPracticeBoard(newBoard); setPracticeLastMove(index); playMoveSound(true);
    const result = checkWinner(newBoard, practiceBoardSize);
    if (result.winner) {
      setPracticeWinner(result.winner); setPracticeWinningLine(result.winningLine); setPracticeStatus('finished'); setPracticeGamesPlayed(g => g + 1); if (result.winner === 'X') { setPracticeWins(w => w + 1); playWinSound(); } return;
    }
    setIsHumanTurn(false);
    setTimeout(() => {
      const ai = AI_STRATEGIES[practiceAIStrategy];
      const aiMove = ai.getMove(newBoard, 'O', practiceBoardSize);
      if (aiMove === -1 || aiMove === undefined) {
        const drawCheck = checkWinner(newBoard, practiceBoardSize);
        if (drawCheck.winner === 'draw') { setPracticeWinner('draw'); setPracticeStatus('finished'); setPracticeGamesPlayed(g => g + 1); return; }
      }
      const aiBoard = [...newBoard]; aiBoard[aiMove] = 'O';
      setPracticeBoard(aiBoard); setPracticeLastMove(aiMove); playMoveSound(true);
      const aiResult = checkWinner(aiBoard, practiceBoardSize);
      if (aiResult.winner) {
        setPracticeWinner(aiResult.winner); setPracticeWinningLine(aiResult.winningLine); setPracticeStatus('finished'); setPracticeGamesPlayed(g => g + 1); if (aiResult.winner === 'X') { setPracticeWins(w => w + 1); playWinSound(); }
      } else { setIsHumanTurn(true); }
    }, 500);
  };

  // UI перевод названий шагов
  const stepTitles: Record<Language, string[]> = {
    en: ['Language', 'Rules', 'Practice', 'Betting', 'AI Setup', 'Battle!'],
    ru: ['Язык', 'Правила', 'Практика', 'Ставки', 'Настройка', 'Битва!'],
    ar: ['اللغة', 'القواعد', 'التدريب', 'الرهان', 'الإعداد', 'المعركة!'],
    zh: ['语言', '规则', '练习', '投注', '设置', '对战!'],
  };

  return (
    <div className="min-h-screen arena-bg py-10 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex justify-between items-start gap-6 flex-wrap">
            <div>
              <h1 className="text-5xl font-bold text-white drop-shadow">{t(language, 'title')}</h1>
              <p className="mt-3 text-white/70 max-w-xl">{t(language, 'subtitle')}</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex gap-2 flex-wrap">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40 cursor-pointer hover:bg-white/15 transition-all"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="en" className="bg-slate-800 text-white">English</option>
                  <option value="ru" className="bg-slate-800 text-white">Русский</option>
                  <option value="ar" className="bg-slate-800 text-white">العربية</option>
                  <option value="zh" className="bg-slate-800 text-white">中文</option>
                </select>
                <div className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm flex items-center gap-2">
                  <span>🪵</span>
                  <span>{balance}</span>
                </div>
              </div>
              <div className="flex gap-2 text-xs text-white/50">
                {stepTitles[language].map((title, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i + 1)}
                    className={`px-2 py-1 rounded-md transition-all ${step === i + 1 ? 'bg-white/20 text-white' : 'hover:bg-white/10'}`}
                  >
                    {i + 1}. {title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 160, damping: 22 }}
            className="grid lg:grid-cols-3 gap-8"
          >
            {/* LEFT (main content spans 2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              {step === 1 && (
                <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10">
                  <h2 className="text-2xl font-bold text-white mb-4">{language === 'ru' ? 'Выбор языка' : 'Choose Language'}</h2>
                  <p className="text-white/70 mb-6 text-sm max-w-prose">
                    {language === 'ru' ? 'Начни с выбора языка интерфейса и перейди к правилам.' : 'Select interface language and continue to the rules.'}
                  </p>
                  <button onClick={next} className="h-14 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 text-white font-semibold shadow-lg hover:shadow-violet-500/40 active:scale-[0.98] transition-all">
                    {language === 'ru' ? 'К правилам →' : 'Go to Rules →'}
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 space-y-6">
                  <h2 className="text-2xl font-bold text-white">{language === 'ru' ? 'Правила' : 'Rules'}</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-500/30">
                      <h3 className="text-emerald-400 font-semibold mb-2 text-sm">{language === 'ru' ? 'Цель' : 'Goal'}</h3>
                      <p className="text-white/80 text-sm">{t(language, 'rules.goal')}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-blue-500/30">
                      <h3 className="text-blue-400 font-semibold mb-2 text-sm">{language === 'ru' ? 'Как играть' : 'How to Play'}</h3>
                      <p className="text-white/80 text-sm">{t(language, 'rules.howToPlay')}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-amber-500/30">
                      <h3 className="text-amber-400 font-semibold mb-2 text-sm">{language === 'ru' ? 'Победа' : 'Win'}</h3>
                      <p className="text-white/80 text-sm">{t(language, 'rules.winLines')}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-purple-500/30">
                      <h3 className="text-purple-400 font-semibold mb-2 text-sm">{language === 'ru' ? 'Ставки' : 'Betting'}</h3>
                      <p className="text-white/80 text-sm">{t(language, 'rules.betting')}</p>
                    </div>
                  </div>
                  <button onClick={next} className="h-14 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 text-white font-semibold shadow-lg hover:shadow-emerald-500/40 active:scale-[0.98] transition-all">
                    {language === 'ru' ? 'К практике →' : 'To Practice →'}
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 space-y-6">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <h2 className="text-2xl font-bold text-white">{language === 'ru' ? 'Практика: Ты vs ИИ' : 'Practice: You vs AI'}</h2>
                    <div className="flex gap-2">
                      {[3,4,5].map(s => (
                        <button key={s} onClick={() => { setPracticeBoardSize(s as BoardSize); setPracticeBoard(createEmptyBoard(s as BoardSize)); setPracticeStatus('idle'); setPracticeWinner(null); setPracticeWinningLine(null); setPracticeLastMove(null); setIsHumanTurn(true); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${practiceBoardSize===s ? 'bg-violet-600 text-white shadow' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>{s}×{s}</button>
                      ))}
                    </div>
                  </div>

                  {practiceStatus === 'idle' && (
                    <div className="grid md:grid-cols-4 gap-2 mb-4">
                      {(['random','defensive','offensive','minimax'] as AIStrategy[]).map(strat => (
                        <button key={strat} onClick={() => setPracticeAIStrategy(strat)} className={`p-3 rounded-lg text-center text-xs font-medium transition-all ${practiceAIStrategy===strat ? 'bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>{strat}</button>
                      ))}
                    </div>
                  )}

                  <div className="rounded-xl bg-black/30 border border-white/10 p-4">
                    <GameBoard board={practiceBoard} winningLine={practiceWinningLine} lastMove={practiceLastMove} onCellClick={makeHumanMove} disabled={practiceStatus!=='playing' || !isHumanTurn} size={practiceBoardSize} />
                  </div>
                  {practiceStatus==='playing' && (
                    <div className={`p-3 rounded-lg text-center text-sm font-medium ${isHumanTurn? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse':'bg-pink-500/20 text-pink-300 border border-pink-500/30'}`}>{isHumanTurn ? (language==='ru'?'Твой ход!':'Your turn!') : (language==='ru'?'ИИ думает...':'AI thinking...')}</div>
                  )}
                  {practiceStatus==='idle' && (
                    <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-center text-sm text-white">{language==='ru'?'Нажми «Начать игру» и делай ход!':'Press Start and make a move!'}</div>
                  )}
                  {practiceStatus==='finished' && practiceWinner && (
                    <div className={`p-4 rounded-lg text-center text-white font-medium ${practiceWinner==='X'?'bg-emerald-500/20 border border-emerald-500/30':practiceWinner==='O'?'bg-rose-500/20 border border-rose-500/30':'bg-yellow-500/20 border border-yellow-500/30'}`}>{practiceWinner==='X'?(language==='ru'?'Ты победил!':'You won!'):practiceWinner==='O'?(language==='ru'?'ИИ победил':'AI won'):(language==='ru'?'Ничья!':'Draw!')}</div>
                  )}
                  {practiceGamesPlayed>0 && (<div className="text-xs text-center text-white/60">{language==='ru'?'Сыграно':'Played'}: {practiceGamesPlayed} | {language==='ru'?'Побед':'Wins'}: {practiceWins}</div>)}
                  <div className="flex gap-3">
                    <button onClick={startPracticeGame} disabled={practiceStatus==='playing' && isHumanTurn} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-emerald-500/40 active:scale-[0.98] transition-all">{practiceStatus==='playing'?(language==='ru'?'Играем...':'Playing...'):(language==='ru'?'Начать':'Start')}</button>
                    <button onClick={()=>{ setPracticeBoard(createEmptyBoard(practiceBoardSize)); setPracticeWinner(null); setPracticeStatus('idle'); setPracticeWinningLine(null); setPracticeLastMove(null); setIsHumanTurn(true); }} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white text-xl hover:bg-white/10 active:scale-95 transition-all">🔄</button>
                  </div>
                  {practiceGamesPlayed>=1 && (<button onClick={next} className="mt-4 w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-medium shadow hover:shadow-purple-500/40 active:scale-[0.98] transition-all">{language==='ru'?'Далее →':'Next →'}</button>)}
                </div>
              )}

              {step === 4 && (
                <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 space-y-6">
                  <h2 className="text-2xl font-bold text-white">{language==='ru'?'Инвестиции':'Investing'}</h2>
                  <p className="text-white/70 text-sm">{language==='ru'?'Сделай ставку и изучи риск / награду.':'Place a bet and learn risk vs reward.'}</p>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2"><span className="text-2xl">🪵</span><span className="text-white/60 text-sm">{language==='ru'?'Баланс':'Balance'}:</span></div>
                    <span className="text-2xl font-bold text-white">{balance}</span>
                  </div>
                  <BettingPanel balance={balance} xOdds={odds.xOdds} oOdds={odds.oOdds} drawOdds={odds.drawOdds} onPlaceBet={placeBet} onEarnMatches={earnMatches} disabled={status==='playing' || !!currentBet} language={language} />
                  {currentBet && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-white">{language==='ru'?'Ставка сделана!':'Bet placed!'} ({currentBet.amount}🪵)</div>
                  )}
                  <button onClick={next} className={`h-14 w-full rounded-xl font-semibold text-white shadow active:scale-[0.98] transition-all ${currentBet?'bg-gradient-to-r from-emerald-600 to-green-500 hover:shadow-emerald-500/40':'bg-gradient-to-r from-indigo-600 to-violet-500 hover:shadow-violet-500/40'}`}>{currentBet?(language==='ru'?'К настройке →':'Setup AI →'):(language==='ru'?'Пропустить →':'Skip →')}</button>
                </div>
              )}

              {step === 5 && (
                <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 space-y-6">
                  <h2 className="text-2xl font-bold text-white">{language==='ru'?'Настройка ИИ':'AI Setup'}</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                      <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-cyan-500 text-white flex items-center justify-center font-bold">X</div><span className="text-white font-medium">{t(language,'xPlayer')}</span></div>
                      <StrategySelect player="X" strategy={xStrategy ?? 'minimax'} onStrategyChange={setXStrategy} disabled={status==='playing'} language={language} />
                    </div>
                    <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/30">
                      <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-pink-500 text-white flex items-center justify-center font-bold">O</div><span className="text-white font-medium">{t(language,'oPlayer')}</span></div>
                      <StrategySelect player="O" strategy={oStrategy ?? 'random'} onStrategyChange={setOStrategy} disabled={status==='playing'} language={language} />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2"><span className="text-lg">⚡</span><span className="text-white font-medium text-sm">{t(language,'gameSpeed')}</span></div>
                    <SpeedControl speed={speed ?? 'normal'} onSpeedChange={setSpeed} disabled={status==='playing'} language={language} />
                  </div>
                  <button onClick={next} className="h-14 w-full rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 text-white font-semibold shadow hover:shadow-orange-500/40 active:scale-[0.98] transition-all">{language==='ru'?'К битве →':'To Battle →'}</button>
                </div>
              )}

              {step === 6 && (
                <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 space-y-6">
                  <h2 className="text-2xl font-bold text-white">{language==='ru'?'Битва ИИ':'AI Battle'}</h2>
                  <div className="flex gap-2 text-xs">
                    <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">X: {t(language, `strategies.${xStrategy??'minimax'}` as any)}</span>
                    <span className="px-3 py-1 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/30">O: {t(language, `strategies.${oStrategy??'random'}` as any)}</span>
                  </div>
                  <div className="rounded-xl bg-black/30 border border-white/10 p-4">
                    <GameBoard board={board} winningLine={winningLine} lastMove={lastMove} />
                  </div>
                  {winner && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center text-white font-medium text-lg">{winner==='draw'?t(language,'drawResult'):t(language,'playerWins',{player:String(winner)})}</div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={startAIBattle} disabled={status==='playing'} className="flex-1 h-14 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-orange-500/40 active:scale-[0.98] transition-all">{status==='playing'?'⏳ ...':'🔥 ' + t(language,'startGame')}</button>
                    <button onClick={resetAIBattle} className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 text-white text-xl hover:bg-white/10 active:scale-95 transition-all">🔄</button>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button onClick={()=>setStep(4)} className="flex-1 h-10 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all">{language==='ru'?'Ставки':'Betting'}</button>
                    <button onClick={()=>setStep(5)} className="flex-1 h-10 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all">{language==='ru'?'Изменить ИИ':'Change AI'}</button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR (История ставок) */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-white font-semibold mb-4 text-sm">{language==='ru'?'История ставок':'Bet History'}</h3>
                {betResults.length === 0 && <p className="text-white/40 text-xs">{language==='ru'?'Пока пусто':'Empty yet'}</p>}
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  {betResults.map((r,i)=>(
                    <div key={i} className="p-3 rounded-lg bg-black/30 border border-white/10 flex justify-between items-center text-xs text-white/70">
                      <span>{r.amount}🪵 → {(r as any).betType === 'draw' ? '=' : (r as any).betType}</span>
                      <span className={r.profit>0?'text-emerald-400':r.profit<0?'text-rose-400':'text-white/50'}>{r.profit>0?'+':' '}{r.profit}🪵</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/50">
                <p>{language==='ru'?'Экспериментальная обучающая версия — настольный режим оформлен по аналогии с мобильным.' : 'Experimental learning version — desktop styled similar to mobile flow.'}</p>
              </div>
              {step>1 && <button onClick={prev} className="w-full h-10 rounded-lg bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 transition-all text-xs">← {language==='ru'?'Назад':'Back'}</button>}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default DesktopFlow;