export type Language = 'en' | 'ru' | 'ar' | 'zh';

export interface Translations {
  // Header
  title: string;
  subtitle: string;
  
  // Players Section
  players: string;
    xPlayer: string;
    oPlayer: string;
  strategy: string;
  thinking: string;
  
  // Strategy Names
  strategies: {
    minimax: string;
    alphabeta: string;
    mcts: string;
    random: string;
    defensive: string;
    offensive: string;
  };
  
  // Game Board
  gameBoard: string;
  drawResult: string;
  playerWins: string;
  
  // Buttons
  startGame: string;
  playing: string;
  newGame: string;
  placeBet: string;
  
  // Betting
  totalizator: string;
    balance: string;
  matches: string;
  selectOutcome: string;
  draw: string;
  betAmount: string;
  potentialWin: string;
  bet: string;
  odds: string;
  lowBalance: string;
  
  // Betting History
  bettingHistory: string;
  noBets: string;
  win: string;
  loss: string;
  totalBets: string;
  wins: string;
  losses: string;
  
  // Controls
  controls: string;
  gameSpeed: string;
  slow: string;
  normal: string;
  fast: string;
  instant: string;
  
  // Statistics
  statistics: string;
  xWins: string;
  oWins: string;
  draws: string;
  
  // Toasts
  toasts: {
    placeBetFirst: string;
    insufficientMatches: string;
    betAccepted: string;
    betAcceptedDraw: string;
    youWon: string;
    youLost: string;
    betReturned: string;
    gameEndedDraw: string;
    playerWinsWith: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    title: 'AI vs AI Tic-Tac-Toe',
    subtitle: 'Watch two AI strategies battle it out',
    
    players: 'Players',
      xPlayer: 'Player X',
      oPlayer: 'Player O',
    strategy: 'Strategy',
    thinking: 'Thinking...',
    
    strategies: {
      minimax: 'Minimax',
      alphabeta: 'Alpha-Beta',
      mcts: 'Monte Carlo',
      random: 'Random',
      defensive: 'Defensive',
      offensive: 'Offensive',
    },
    
    gameBoard: 'Game Board',
    drawResult: 'Draw! Both AIs played well.',
    playerWins: 'Player {player} wins!',
    
    startGame: 'Start Game',
    playing: 'Playing...',
    newGame: 'New Game',
    placeBet: 'Place Bet',
    
    totalizator: 'Betting',
      balance: 'Balance',
    matches: 'matches',
    selectOutcome: 'Select outcome',
    draw: 'Draw',
    betAmount: 'Bet amount',
    potentialWin: 'Potential win',
    bet: 'Bet',
    odds: 'Odds',
    lowBalance: '⚠️ Low balance! Place a smaller bet or reset statistics.',
    
    bettingHistory: 'Betting History',
    noBets: 'No bets yet. Place your first bet!',
    win: 'Win',
    loss: 'Loss',
    totalBets: 'Total bets',
    wins: 'Wins',
    losses: 'Losses',
    
    controls: 'Controls',
    gameSpeed: 'Game Speed',
    slow: 'Slow',
    normal: 'Normal',
    fast: 'Fast',
    instant: 'Instant',
    
    statistics: 'Statistics',
    xWins: 'X Wins',
    oWins: 'O Wins',
    draws: 'Draws',
    
    toasts: {
      placeBetFirst: 'Place a bet before starting the game!',
      insufficientMatches: 'Insufficient matches!',
      betAccepted: 'Bet of {amount} matches on player {player} accepted!',
      betAcceptedDraw: 'Bet of {amount} matches on draw accepted!',
      youWon: '🎉 You won {amount} matches!',
      youLost: '😞 You lost {amount} matches',
      betReturned: 'Bet returned: 0 matches',
      gameEndedDraw: 'Game ended in a draw!',
      playerWinsWith: 'Player {player} wins with {strategy}!',
    },
  },
  
  ru: {
    title: 'ИИ против ИИ - Крестики-нолики',
    subtitle: 'Наблюдайте за битвой двух стратегий ИИ',
    
    players: 'Игроки',
      xPlayer: 'Игрок X',
      oPlayer: 'Игрок O',
    strategy: 'Стратегия',
      balance: 'Баланс',
    thinking: 'Думает...',
    
    strategies: {
      minimax: 'Минимакс',
      alphabeta: 'Альфа-бета',
      mcts: 'Монте-Карло',
      random: 'Случайный',
      defensive: 'Защитный',
      offensive: 'Атакующий',
    },
    
    gameBoard: 'Игровое поле',
    drawResult: '🤝 Ничья! Обе ИИ сыграли хорошо.',
    playerWins: '🎉 Игрок {player} победил!',
    
    startGame: 'Начать игру',
    playing: 'Играем...',
    newGame: 'Новая игра',
    placeBet: 'Сделать ставку',
    
    totalizator: 'Тотализатор',
    matches: 'спичек',
    selectOutcome: 'Выберите исход',
    draw: 'Ничья',
    betAmount: 'Сумма ставки',
    potentialWin: 'Возможный выигрыш',
    bet: 'Ставка',
    odds: 'Коэф',
    lowBalance: '⚠️ Низкий баланс! Поставьте меньшую сумму или сбросьте статистику.',
    
    bettingHistory: 'История ставок',
    noBets: 'Ставок пока нет. Сделайте первую ставку!',
    win: 'Выигрыш',
    loss: 'Проигрыш',
    totalBets: 'Всего ставок',
    wins: 'Выигрышей',
    losses: 'Проигрышей',
    
    controls: 'Управление',
    gameSpeed: 'Скорость игры',
    slow: 'Медленно',
    normal: 'Нормально',
    fast: 'Быстро',
    instant: 'Мгновенно',
    
    statistics: 'Статистика',
    xWins: 'Побед X',
    oWins: 'Побед O',
    draws: 'Ничьих',
    
    toasts: {
      placeBetFirst: 'Сделайте ставку перед началом игры!',
      insufficientMatches: 'Недостаточно спичек!',
      betAccepted: 'Ставка {amount} спичек на игрока {player} принята!',
      betAcceptedDraw: 'Ставка {amount} спичек на ничью принята!',
      youWon: '🎉 Вы выиграли {amount} спичек!',
      youLost: '😞 Вы проиграли {amount} спичек',
      betReturned: 'Ставка возвращена: 0 спичек',
      gameEndedDraw: 'Игра закончилась вничью!',
      playerWinsWith: 'Игрок {player} победил со стратегией {strategy}!',
    },
  },
  
  ar: {
    title: 'الذكاء الاصطناعي ضد الذكاء الاصطناعي - تيك تاك تو',
    subtitle: 'شاهد معركة استراتيجيتين للذكاء الاصطناعي',
    
    players: 'اللاعبون',
      xPlayer: 'اللاعب X',
      oPlayer: 'اللاعب O',
    strategy: 'الاستراتيجية',
      balance: 'الرصيد',
    thinking: 'يفكر...',
    
    strategies: {
      minimax: 'مينيماكس',
      alphabeta: 'ألفا بيتا',
      mcts: 'مونت كارلو',
      random: 'عشوائي',
      defensive: 'دفاعي',
      offensive: 'هجومي',
    },
    
    gameBoard: 'لوحة اللعبة',
    drawResult: '🤝 تعادل! كلا الذكاءين الاصطناعيين لعبا بشكل جيد.',
    playerWins: '🎉 اللاعب {player} يفوز!',
    
    startGame: 'ابدأ اللعبة',
    playing: 'جارٍ اللعب...',
    newGame: 'لعبة جديدة',
    placeBet: 'ضع الرهان',
    
    totalizator: 'الرهان',
    matches: 'أعواد',
    selectOutcome: 'اختر النتيجة',
    draw: 'تعادل',
    betAmount: 'مبلغ الرهان',
    potentialWin: 'الربح المحتمل',
    bet: 'رهان',
    odds: 'المعدل',
    lowBalance: '⚠️ رصيد منخفض! ضع رهانًا أصغر أو أعد تعيين الإحصائيات.',
    
    bettingHistory: 'سجل الرهانات',
    noBets: 'لا توجد رهانات بعد. ضع أول رهان!',
    win: 'فوز',
    loss: 'خسارة',
    totalBets: 'إجمالي الرهانات',
    wins: 'الانتصارات',
    losses: 'الخسائر',
    
    controls: 'التحكم',
    gameSpeed: 'سرعة اللعبة',
    slow: 'بطيء',
    normal: 'عادي',
    fast: 'سريع',
    instant: 'فوري',
    
    statistics: 'الإحصائيات',
    xWins: 'انتصارات X',
    oWins: 'انتصارات O',
    draws: 'التعادلات',
    
    toasts: {
      placeBetFirst: 'ضع رهانًا قبل بدء اللعبة!',
      insufficientMatches: 'أعواد غير كافية!',
      betAccepted: 'تم قبول رهان {amount} أعواد على اللاعب {player}!',
      betAcceptedDraw: 'تم قبول رهان {amount} أعواد على التعادل!',
      youWon: '🎉 لقد ربحت {amount} أعواد!',
      youLost: '😞 لقد خسرت {amount} أعواد',
      betReturned: 'إرجاع الرهان: 0 أعواد',
      gameEndedDraw: 'انتهت اللعبة بالتعادل!',
      playerWinsWith: 'اللاعب {player} يفوز باستراتيجية {strategy}!',
    },
  },
  
  zh: {
    title: 'AI对战AI - 井字棋',
    subtitle: '观看两个AI策略的对决',
    
    players: '玩家',
      xPlayer: '玩家 X',
      oPlayer: '玩家 O',
    strategy: '策略',
    thinking: '思考中...',
    
    strategies: {
      minimax: '极小化极大',
      alphabeta: 'Alpha-Beta',
      mcts: '蒙特卡洛',
      random: '随机',
      defensive: '防守型',
      offensive: '进攻型',
    },
    
    gameBoard: '游戏棋盘',
    drawResult: '🤝 平局！双方AI表现出色。',
    playerWins: '🎉 玩家{player}获胜！',
    
    startGame: '开始游戏',
    playing: '游戏进行中...',
    newGame: '新游戏',
    placeBet: '下注',
    
    totalizator: '投注',
      balance: '余额',
    matches: '火柴',
    selectOutcome: '选择结果',
    draw: '平局',
    betAmount: '投注金额',
    potentialWin: '可能赢得',
    bet: '投注',
    odds: '赔率',
    lowBalance: '⚠️ 余额不足！请下注较小金额或重置统计。',
    
    bettingHistory: '投注历史',
    noBets: '还没有投注。进行首次投注！',
    win: '赢',
    loss: '输',
    totalBets: '总投注',
    wins: '胜利次数',
    losses: '失败次数',
    
    controls: '控制',
    gameSpeed: '游戏速度',
    slow: '慢',
    normal: '正常',
    fast: '快',
    instant: '瞬间',
    
    statistics: '统计',
    xWins: 'X获胜',
    oWins: 'O获胜',
    draws: '平局',
    
    toasts: {
      placeBetFirst: '开始游戏前请先下注！',
      insufficientMatches: '火柴不足！',
      betAccepted: '接受{amount}火柴投注在玩家{player}上！',
      betAcceptedDraw: '接受{amount}火柴投注在平局上！',
      youWon: '🎉 您赢得了{amount}根火柴！',
      youLost: '😞 您输了{amount}根火柴',
      betReturned: '投注返还：0根火柴',
      gameEndedDraw: '游戏以平局结束！',
      playerWinsWith: '玩家{player}使用{strategy}策略获胜！',
    },
  },
};

export function t(lang: Language, key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  if (typeof value !== 'string') {
    return key;
  }
  
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ''));
  }
  
  return value;
}
