import { Language } from '@/lib/i18n';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
];

export function LanguageSwitcher({ currentLanguage, onLanguageChange }: LanguageSwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      <Globe size={16} weight="bold" className="text-muted-foreground" />
      <RadioGroup
        value={currentLanguage}
        onValueChange={(v) => onLanguageChange(v as Language)}
        className="flex items-center gap-2"
      >
        {languages.map((lang) => {
          const id = `lang-${lang.code}`;
          const selected = currentLanguage === lang.code;
          return (
            <div key={lang.code} className={cn(
              'flex items-center gap-2 rounded-md border px-2 py-1 transition-colors cursor-pointer',
              selected ? 'bg-accent text-accent-foreground border-accent' : 'bg-background'
            )}>
              <RadioGroupItem value={lang.code} id={id} />
              <label htmlFor={id} className="text-sm leading-none cursor-pointer">
                {lang.nativeName}
              </label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
