import { Lightning, Gauge, Horse, LightningSlash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Language, t } from '@/lib/i18n';

export type GameSpeed = 'slow' | 'normal' | 'fast' | 'instant';

interface SpeedControlProps {
  speed: GameSpeed;
  onSpeedChange: (speed: GameSpeed) => void;
  disabled?: boolean;
  language: Language;
}

const SPEED_OPTIONS: { value: GameSpeed; iconComp: React.ReactNode; delay: number }[] = [
  { value: 'slow', iconComp: <Horse />, delay: 1500 },
  { value: 'normal', iconComp: <Gauge />, delay: 800 },
  { value: 'fast', iconComp: <Lightning />, delay: 300 },
  { value: 'instant', iconComp: <LightningSlash />, delay: 0 },
];

export function getSpeedDelay(speed: GameSpeed): number {
  return SPEED_OPTIONS.find((opt) => opt.value === speed)?.delay ?? 800;
}

export function SpeedControl({ speed, onSpeedChange, disabled, language }: SpeedControlProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-muted-foreground">{t(language, 'gameSpeed')}</label>
      <div className="flex gap-2 flex-wrap">
        {SPEED_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={speed === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSpeedChange(option.value)}
            disabled={disabled}
            className={cn('flex items-center gap-2', speed === option.value && 'ring-2 ring-ring')}
          >
            {option.iconComp}
            {t(language, option.value)}
          </Button>
        ))}
      </div>
    </div>
  );
}
