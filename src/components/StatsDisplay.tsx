import { GameStats } from '@/lib/game';

interface StatsDisplayProps {
  stats: GameStats;
}

export function StatsDisplay({ stats }: StatsDisplayProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center p-4 bg-card rounded-lg border border-border">
        <div className="text-3xl font-bold text-[var(--color-player-x)]">{stats.xWins}</div>
        <div className="text-sm text-muted-foreground mt-1">X Wins</div>
      </div>
      <div className="text-center p-4 bg-card rounded-lg border border-border">
        <div className="text-3xl font-bold text-muted-foreground">{stats.draws}</div>
        <div className="text-sm text-muted-foreground mt-1">Draws</div>
      </div>
      <div className="text-center p-4 bg-card rounded-lg border border-border">
        <div className="text-3xl font-bold text-[var(--color-player-o)]">{stats.oWins}</div>
        <div className="text-sm text-muted-foreground mt-1">O Wins</div>
      </div>
    </div>
  );
}
