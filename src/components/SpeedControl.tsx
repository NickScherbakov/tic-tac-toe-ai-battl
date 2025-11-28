import { Lightning, Gauge, Horse, LightningSlash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type GameSpeed = 'slow' | 'normal' | 'fast' | 'instant';

interface SpeedControlProps {
  speed: GameSpeed;
  onSpeedChange: (speed: GameSpeed) => void;
  disabled?: boolean;
}

const SPEED_OPTIONS: { value: GameSpeed; label: string; icon: React.ReactNode; delay: number }[] = [
  { value: 'slow', label: 'Slow', icon: <Horse />, delay: 1500 },
  { value: 'normal', label: 'Normal', icon: <Gauge />, delay: 800 },
  { value: 'fast', label: 'Fast', icon: <Lightning />, delay: 300 },
  { value: 'instant', label: 'Instant', icon: <LightningSlash />, delay: 0 },
];

export function getSpeedDelay(speed: GameSpeed): number {
  return SPEED_OPTIONS.find((opt) => opt.value === speed)?.delay ?? 800;
}

export function SpeedControl({ speed, onSpeedChange, disabled }: SpeedControlProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-muted-foreground">Game Speed</label>
      <div className="flex gap-2 flex-wrap">
        {SPEED_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={speed === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSpeedChange(option.value)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-2',
              speed === option.value && 'bg-primary text-primary-foreground'
            )}
          >
            {option.icon}
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
