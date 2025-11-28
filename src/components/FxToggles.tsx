import { useKV } from '@github/spark/hooks';
import { Language, t } from '@/lib/i18n';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FxTogglesProps { language: Language; }

export function FxToggles({ language }: FxTogglesProps) {
  const [soundEnabled, setSoundEnabled] = useKV<boolean>('fx-sound', true);
  const [animEnabled, setAnimEnabled] = useKV<boolean>('fx-anim', true);
  return (
    <div className="glass-card p-3 rounded-lg flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{t(language,'balance')}: FX Sound</Label>
        <Switch checked={!!soundEnabled} onCheckedChange={(v)=>setSoundEnabled(v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Animations</Label>
        <Switch checked={!!animEnabled} onCheckedChange={(v)=>setAnimEnabled(v)} />
      </div>
    </div>
  );
}