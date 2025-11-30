export type Language = 'en' | 'ru' | 'ar' | 'zh';

export interface Translations {
  // Header
  title: string;
  subtitle: string;
  language?: string;
  rulesTitle?: string;
  step?: string;
  rules?: {
    goal: string;
    howToPlay: string;
    winLines: string;
    betting: string;
  };
  
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
  betting?: string;
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
  
  // Earn Matches Mini-Game
  earnMatches: {
    title: string;
    description: string;
    question: string;
    yourAnswer: string;
    wrongAnswer: string;
    newTask: string;
    reward: string;
    cancel: string;
    submit: string;
  };

  // Onboarding
  onboarding: {
    title: string;
    stepBet: string;
    stepStart: string;
    stepObserve: string;
    close: string;
  };
  
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
    matchesEarned: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    title: 'AI vs AI Tic-Tac-Toe',
    subtitle: 'Watch two AI strategies battle it out',
    language: 'Language',
    rulesTitle: 'Game Rules',
    step: 'Step',
    rules: {
      goal: 'Goal: make a line of three marks (row, column, diagonal).',
      howToPlay: 'Turns alternate. Tap a cell to place a mark.',
      winLines: 'Winning lines: 3 in a row, 3 in a column, or 3 diagonally.',
      betting: 'Betting: choose outcome (X, O, Draw), place matches, and watch the game.',
    },
    
    players: 'Players',
      xPlayer: 'Player X',
      oPlayer: 'Player O',
    strategy: 'Strategy',
    thinking: 'Thinking...',
    
    strategies: {
      minimax: 'Calculated',
      alphabeta: 'Alpha-Beta',
      mcts: 'Monte Carlo',
      random: 'Impulsive',
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
    betting: 'Betting',
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
    
    earnMatches: {
      title: 'Earn Matches',
      description: 'Solve a math problem to earn 50 matches!',
      question: 'Solve the problem:',
      yourAnswer: 'Your answer',
      wrongAnswer: '❌ Wrong answer, try again!',
      newTask: 'New problem generated.',
      reward: 'Correct answer = 50 matches',
      cancel: 'Cancel',
      submit: 'Check Answer',
    },

    onboarding: {
      title: 'Welcome to the AI Arena',
      stepBet: '1. Place a bet using the Betting panel.',
      stepStart: '2. Press Start Game to let AIs fight.',
      stepObserve: '3. Watch strategies & collect matches.',
      close: 'Got it!',
    },
    
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
      matchesEarned: '🎉 Great job! You earned {amount} matches!',
    },
  },
  
  ru: {
    title: 'ИИ против ИИ - Крестики-нолики',
    subtitle: 'Наблюдайте за битвой двух стратегий ИИ',
    language: 'Язык',
    rulesTitle: 'Правила игры',
    step: 'Шаг',
    rules: {
      goal: 'Цель: собрать линию из трёх символов (ряд, столбец, диагональ).',
      howToPlay: 'Ходы по очереди. Нажмите на клетку, чтобы поставить символ.',
      winLines: 'Выигрышные линии: 3 в ряд, 3 в столбец или 3 по диагонали.',
      betting: 'Ставки: выберите исход (X, O, ничья), поставьте спички и наблюдайте игру.',
    },
    
    players: 'Игроки',
      xPlayer: 'Игрок X',
      oPlayer: 'Игрок O',
    strategy: 'Стратегия',
      balance: 'Баланс',
    thinking: 'Думает...',
    
    strategies: {
      minimax: 'Расчётливая',
      alphabeta: 'Альфа-бета',
      mcts: 'Монте-Карло',
      random: 'Импульсивная',
      defensive: 'Оборонительная',
      offensive: 'Наступательная',
    },
    
    gameBoard: 'Игровое поле',
    drawResult: '🤝 Ничья! Обе ИИ сыграли хорошо.',
    playerWins: '🎉 Игрок {player} победил!',
    
    startGame: 'Начать игру',
    playing: 'Играем...',
    newGame: 'Новая игра',
    placeBet: 'Сделать ставку',
    
    totalizator: 'Тотализатор',
    betting: 'Тотализатор',
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
    
    earnMatches: {
      title: 'Заработать спички',
      description: 'Реши математическую задачу и получи 50 спичек!',
      question: 'Реши задачу:',
      yourAnswer: 'Твой ответ',
      wrongAnswer: '❌ Неправильно, попробуй ещё!',
      newTask: 'Новая задача.',
      reward: 'Правильный ответ = 50 спичек',
      cancel: 'Отмена',
      submit: 'Проверить',
    },

    onboarding: {
      title: 'Добро пожаловать на арену ИИ',
      stepBet: '1. Сделайте ставку в панели тотализатора.',
      stepStart: '2. Нажмите «Начать игру».',
      stepObserve: '3. Наблюдайте за стратегиями и копите спички.',
      close: 'Понятно!',
    },
    
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
      matchesEarned: '🎉 Отлично! Ты заработал {amount} спичек!',
    },
  },
  
  ar: {
    title: 'الذكاء الاصطناعي ضد الذكاء الاصطناعي - تيك تاك تو',
    subtitle: 'شاهد معركة استراتيجيتين للذكاء الاصطناعي',
    language: 'اللغة',
    rulesTitle: 'قواعد اللعبة',
    step: 'الخطوة',
    rules: {
      goal: 'الهدف: صنع صف من ثلاثة رموز (صف، عمود، قطري).',
      howToPlay: 'الأدوار تتناوب. اضغط على خلية لوضع الرمز.',
      winLines: 'خطوط الفوز: 3 في صف، 3 في عمود، أو 3 قطريًا.',
      betting: 'الرهان: اختر النتيجة (X أو O أو تعادل)، ضع الأعواد، وشاهد المباراة.',
    },
    
    players: 'اللاعبون',
      xPlayer: 'اللاعب X',
      oPlayer: 'اللاعب O',
    strategy: 'الاستراتيجية',
      balance: 'الرصيد',
    thinking: 'يفكر...',
    
    strategies: {
      minimax: 'محسوبة',
      alphabeta: 'ألفا بيتا',
      mcts: 'مونت كارلو',
      random: 'اندفاعية',
      defensive: 'دفاعية',
      offensive: 'هجومية',
    },
    
    gameBoard: 'لوحة اللعبة',
    drawResult: '🤝 تعادل! كلا الذكاءين الاصطناعيين لعبا بشكل جيد.',
    playerWins: '🎉 اللاعب {player} يفوز!',
    
    startGame: 'ابدأ اللعبة',
    playing: 'جارٍ اللعب...',
    newGame: 'لعبة جديدة',
    placeBet: 'ضع الرهان',
    
    totalizator: 'الرهان',
    betting: 'الرهان',
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
    
    earnMatches: {
      title: 'اكسب أعوادًا',
      description: 'حل مسألة رياضية واحصل على 50 عودًا!',
      question: 'حل المسألة:',
      yourAnswer: 'إجابتك',
      wrongAnswer: '❌ إجابة خاطئة، حاول مرة أخرى!',
      newTask: 'مسألة جديدة.',
      reward: 'إجابة صحيحة = 50 عودًا',
      cancel: 'إلغاء',
      submit: 'تحقق من الإجابة',
    },

    onboarding: {
      title: 'مرحبًا بك في ساحة الذكاء الاصطناعي',
      stepBet: '1. ضع رهانًا من لوحة الرهان.',
      stepStart: '2. اضغط بدء اللعبة.',
      stepObserve: '3. شاهد الاستراتيجيات واجمع الأعواد.',
      close: 'حسنا!',
    },
    
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
      matchesEarned: '🎉 أحسنت! لقد كسبت {amount} عودًا!',
    },
  },
  
  zh: {
    title: 'AI对战AI - 井字棋',
    subtitle: '观看两个AI策略的对决',
    language: '语言',
    rulesTitle: '游戏规则',
    step: '步骤',
    rules: {
      goal: '目标：连成三个相同符号（行、列、对角线）。',
      howToPlay: '轮流下子。点击格子放置符号。',
      winLines: '胜利条件：同行三连、同列三连或对角线三连。',
      betting: '投注：选择结果（X、O、平局），下注火柴并观看比赛。',
    },
    
    players: '玩家',
      xPlayer: '玩家 X',
      oPlayer: '玩家 O',
    strategy: '策略',
    thinking: '思考中...',
    
    strategies: {
      minimax: '精打细算',
      alphabeta: 'Alpha-Beta',
      mcts: '蒙特卡洛',
      random: '冲动型',
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
    betting: '投注',
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
    
    earnMatches: {
      title: '赚取火柴',
      description: '解决数学题赚取50根火柴！',
      question: '解决问题：',
      yourAnswer: '你的答案',
      wrongAnswer: '❌ 错误答案，再试一次！',
      newTask: '新问题。',
      reward: '正确答案 = 50根火柴',
      cancel: '取消',
      submit: '检查答案',
    },

    onboarding: {
      title: '欢迎来到 AI 竞技场',
      stepBet: '1. 在投注面板下注。',
      stepStart: '2. 点击开始游戏。',
      stepObserve: '3. 观看策略对决并赚取火柴。',
      close: '知道了!',
    },
    
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
      matchesEarned: '🎉 做得好！你赚了{amount}根火柴！',
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
