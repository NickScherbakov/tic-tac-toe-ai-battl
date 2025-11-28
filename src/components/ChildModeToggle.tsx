import { useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { cn } from '@/lib/utils';

interface ChildModeToggleProps {
  language: string;
}

// Simple localized label map (reuse existing i18n later if desired)
const LABELS: Record<string, { on: string; off: string }> = {
  en: { on: 'Child Mode', off: 'Child Mode' },
  ru: { on: 'Детский режим', off: 'Детский режим' },
  ar: { on: 'وضع الأطفال', off: 'وضع الأطفال' },
  zh: { on: '儿童模式', off: '儿童模式' },
};

export function ChildModeToggle({ language }: ChildModeToggleProps) {
  const [childMode, setChildMode] = useKV<boolean>('child-mode', true);

  // Apply root class for scaling when enabled
  useEffect(() => {
    const root = document.documentElement;
    if (childMode) root.classList.add('child-mode-root');
    else root.classList.remove('child-mode-root');
  }, [childMode]);

  const label = LABELS[language] || LABELS.en;

  return (
    <button
      type="button"
      onClick={() => setChildMode(!childMode)}
      aria-pressed={childMode}
      className={cn('child-toggle-btn', !childMode && 'off')}
    >
      {childMode ? label.on : label.off}
    </button>
  );
}
