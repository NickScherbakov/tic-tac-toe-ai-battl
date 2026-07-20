import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Language } from '@/lib/i18n';
import type { AchievementDefinition, DailyChallenge, DailyChallengeResult, LeaderboardEntry, PredictedOutcome, Winner } from '@/lib/viral';
import { ACHIEVEMENTS, formatStrategyName, getPredictedStrategyLabel, type BattleReplay } from '@/lib/viral';
import type { ShareSummary } from '@/hooks/use-viral-growth';
import type { AIStrategy } from '@/lib/ai';

function copy(language: Language, text: Record<Language, string>) {
  return text[language];
}

function describeOutcome(outcome: PredictedOutcome | null, xStrategy: AIStrategy, oStrategy: AIStrategy) {
  if (!outcome) return '—';
  return getPredictedStrategyLabel(outcome, xStrategy, oStrategy);
}

function describeWinner(winner: Winner) {
  if (winner === 'draw') return 'Draw';
  if (!winner) return '—';
  return `Player ${winner}`;
}

export function QuickStartButton({
  language,
  onClick,
}: {
  language: Language;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="h-12 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-500 px-5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-cyan-500/40 active:scale-[0.98]"
    >
      ⚡ {copy(language, {
        en: 'Watch battle right now',
        ru: 'Смотреть битву прямо сейчас',
        ar: 'شاهد المعركة الآن',
        zh: '立即观看对战',
      })}
    </button>
  );
}

export function HallOfFameCard({
  language,
  leaderboard,
  gamesPlayed,
  streak,
}: {
  language: Language;
  leaderboard: LeaderboardEntry[];
  gamesPlayed: number;
  streak: { current: number; longest: number };
}) {
  const [animatedGames, setAnimatedGames] = useState(0);

  useEffect(() => {
    const target = gamesPlayed;
    const id = window.setInterval(() => {
      setAnimatedGames((value) => {
        if (value >= target) {
          window.clearInterval(id);
          return target;
        }
        return value + Math.max(1, Math.ceil((target - value) / 6));
      });
    }, 60);

    return () => window.clearInterval(id);
  }, [gamesPlayed]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Hall of Fame</p>
          <h3 className="text-lg font-semibold text-white">
            {copy(language, {
              en: 'Top predictions',
              ru: 'Топ ставок',
              ar: 'أفضل التوقعات',
              zh: '最佳预测',
            })}
          </h3>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-right">
          <div className="text-[10px] uppercase text-emerald-300/70">
            {copy(language, { en: 'Games played', ru: 'Сыграно', ar: 'تم اللعب', zh: '已玩对局' })}
          </div>
          <div className="text-2xl font-bold text-emerald-300">{animatedGames}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-white">
          <div className="text-white/60">
            {copy(language, { en: 'Win streak', ru: 'Стрик побед', ar: 'سلسلة الفوز', zh: '连胜天数' })}
          </div>
          <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
            <span>{streak.current}</span>
            <span>{copy(language, { en: 'days', ru: 'дн.', ar: 'أيام', zh: '天' })}</span>
            {streak.current >= 3 && <span>🔥</span>}
          </div>
        </div>
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-white">
          <div className="text-white/60">
            {copy(language, { en: 'Best streak', ru: 'Лучший стрик', ar: 'أفضل سلسلة', zh: '最佳连胜' })}
          </div>
          <div className="mt-1 text-lg font-semibold">{streak.longest}</div>
        </div>
      </div>

      <div className="space-y-2">
        {leaderboard.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/50">
            {copy(language, {
              en: 'Win a bet to enter the Hall of Fame.',
              ru: 'Выиграй ставку, чтобы попасть в Hall of Fame.',
              ar: 'اربح رهاناً لدخول قاعة الشهرة.',
              zh: '赢下一次下注即可进入名人堂。',
            })}
          </div>
        ) : (
          leaderboard.map((entry, index) => (
            <div key={entry.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white">
              <div>
                <div className="font-semibold">#{index + 1} {entry.name}</div>
                <div className="text-xs text-white/60">
                  {describeOutcome(entry.predictedOutcome, entry.xStrategy, entry.oStrategy)} → {describeWinner(entry.actualWinner)}
                </div>
              </div>
              <div className="text-right text-emerald-300 font-semibold">+{entry.profit}🪵</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AchievementsCard({
  language,
  achievements,
}: {
  language: Language;
  achievements: Array<keyof typeof ACHIEVEMENTS>;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Achievements</p>
          <h3 className="text-lg font-semibold text-white">
            {copy(language, {
              en: 'Badge cabinet',
              ru: 'Достижения',
              ar: 'الإنجازات',
              zh: '成就徽章',
            })}
          </h3>
        </div>
        <div className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm font-semibold text-violet-200">
          {achievements.length}/{Object.keys(ACHIEVEMENTS).length}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 text-sm">
        {Object.values(ACHIEVEMENTS).map((achievement) => {
          const unlocked = achievements.includes(achievement.id);
          return (
            <div key={achievement.id} className={`rounded-xl border px-3 py-3 ${unlocked ? 'border-violet-500/30 bg-violet-500/10 text-white' : 'border-white/10 bg-black/20 text-white/40'}`}>
              <div className="font-medium">{achievement.emoji} {achievement.title}</div>
              <div className="text-xs mt-1">{achievement.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DailyChallengeCard({
  language,
  challenge,
  result,
  onLoad,
}: {
  language: Language;
  challenge: DailyChallenge;
  result: DailyChallengeResult | null;
  onLoad: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Daily Challenge</p>
          <h3 className="text-lg font-semibold text-white">
            {formatStrategyName(challenge.xStrategy)} vs {formatStrategyName(challenge.oStrategy)}
          </h3>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-200">
          {challenge.boardSize}×{challenge.boardSize}
        </div>
      </div>
      <p className="text-sm text-white/70">
        {copy(language, {
          en: 'A fresh deterministic matchup every day. Lock in your bet and compare notes with friends.',
          ru: 'Каждый день новая фиксированная пара стратегий. Сделай ставку и сравни результат с друзьями.',
          ar: 'كل يوم مواجهة ثابتة جديدة. ضع رهانك وقارن النتيجة مع الأصدقاء.',
          zh: '每天都有固定的新策略对决。下注并和朋友比较结果。',
        })}
      </p>
      {result ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-white">
          ✅ {copy(language, { en: 'Completed', ru: 'Пройдено', ar: 'تم الإنجاز', zh: '已完成' })}: {describeWinner(result.winner)}
        </div>
      ) : (
        <button onClick={onLoad} className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-white shadow transition-all hover:shadow-orange-500/40 active:scale-[0.98]">
          🎲 {copy(language, { en: 'Load today’s challenge', ru: 'Загрузить челлендж дня', ar: 'حمّل تحدي اليوم', zh: '加载今日挑战' })}
        </button>
      )}
    </div>
  );
}

export function SharePanel({
  language,
  summary,
  challengeName,
  onSaveCard,
}: {
  language: Language;
  summary: ShareSummary | null;
  challengeName?: string;
  onSaveCard: (replay: BattleReplay) => void;
}) {
  const [copied, setCopied] = useState(false);

  const challengeLabel = useMemo(() => challengeName?.trim() || 'friend', [challengeName]);

  if (!summary) return null;

  const openShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyReplay = async () => {
    await navigator.clipboard.writeText(summary.replayUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const copyChallenge = async () => {
    await navigator.clipboard.writeText(summary.challengeUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-white/40">Viral loop</p>
        <h3 className="text-lg font-semibold text-white">
          {copy(language, { en: 'Share the showdown', ru: 'Поделиться битвой', ar: 'شارك المواجهة', zh: '分享这场对战' })}
        </h3>
      </div>

      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-white/90">
        {summary.shareText}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => openShare(summary.links.x)} className="h-11 rounded-xl bg-black/30 text-white transition-all hover:bg-black/45">𝕏 / Twitter</button>
        <button onClick={() => openShare(summary.links.telegram)} className="h-11 rounded-xl bg-sky-500/20 text-white transition-all hover:bg-sky-500/30">Telegram</button>
        <button onClick={() => openShare(summary.links.whatsapp)} className="h-11 rounded-xl bg-emerald-500/20 text-white transition-all hover:bg-emerald-500/30">WhatsApp</button>
        <button onClick={() => openShare(summary.links.vk)} className="h-11 rounded-xl bg-indigo-500/20 text-white transition-all hover:bg-indigo-500/30">VK</button>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <button onClick={copyReplay} className="h-11 rounded-xl border border-white/10 bg-white/5 text-sm text-white transition-all hover:bg-white/10">
          🔗 {copy(language, { en: 'Copy replay link', ru: 'Скопировать replay-ссылку', ar: 'انسخ رابط الإعادة', zh: '复制回放链接' })}
        </button>
        <button onClick={copyChallenge} className="h-11 rounded-xl border border-white/10 bg-white/5 text-sm text-white transition-all hover:bg-white/10">
          🥊 {copy(language, { en: `Challenge ${challengeLabel}`, ru: 'Вызвать друга', ar: 'تحدَّ صديقاً', zh: '挑战好友' })}
        </button>
        <button onClick={() => onSaveCard(summary.replay)} className="h-11 rounded-xl border border-white/10 bg-white/5 text-sm text-white transition-all hover:bg-white/10 md:col-span-2">
          🖼️ {copy(language, { en: 'Save brag card', ru: 'Сохранить карточку', ar: 'احفظ بطاقة النتيجة', zh: '保存战绩卡片' })}
        </button>
      </div>

      {copied && <div className="text-xs text-emerald-300">✓ {copy(language, { en: 'Link copied', ru: 'Ссылка скопирована', ar: 'تم نسخ الرابط', zh: '链接已复制' })}</div>}
    </div>
  );
}

export function AchievementPopup({
  achievement,
  onClose,
}: {
  achievement: AchievementDefinition | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-violet-400/40 bg-slate-950/95 p-5 text-white shadow-2xl"
        >
          <button onClick={onClose} className="absolute right-3 top-3 text-white/50 transition hover:text-white">✕</button>
          <div className="text-3xl">{achievement.emoji}</div>
          <div className="mt-2 text-xs uppercase tracking-[0.25em] text-violet-300">Achievement unlocked</div>
          <div className="mt-2 text-xl font-semibold">{achievement.title}</div>
          <div className="mt-2 text-sm text-white/70">{achievement.description}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function saveReplayCardAsImage(replay: BattleReplay) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(1, '#7c3aed');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px Inter, sans-serif';
  ctx.fillText('AI Battle Brag Card', 72, 100);

  ctx.font = '36px Inter, sans-serif';
  ctx.fillText(`${replay.playerName} backed ${describeOutcome(replay.predictedOutcome, replay.xStrategy, replay.oStrategy)}`, 72, 190);
  ctx.fillText(`Winner: ${describeWinner(replay.winner)}`, 72, 250);
  ctx.fillText(`Matchup: ${formatStrategyName(replay.xStrategy)} vs ${formatStrategyName(replay.oStrategy)}`, 72, 310);
  ctx.fillText(`Profit: ${replay.profit} matches`, 72, 370);

  ctx.font = '28px Inter, sans-serif';
  ctx.fillStyle = '#c4b5fd';
  ctx.fillText('nickscherbakov.github.io/tic-tac-toe-ai-battl', 72, 560);

  const link = document.createElement('a');
  link.download = `ai-battle-${replay.timestamp}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
