import { Language } from '@/lib/i18n';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  childMode?: boolean;
}

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
];

const FLAG: Record<Language,string> = { en: '🇬🇧', ru: '🇷🇺', ar: '🇸🇦', zh: '🇨🇳' };

export function LanguageSwitcher({ currentLanguage, onLanguageChange, childMode }: LanguageSwitcherProps) {
  return (
    <div className={cn('flex items-center gap-2 lang-wrapper', childMode && 'child-mode')}>      
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
            <div
              key={lang.code}
              className={cn(childMode ? 'lang-pill' : 'flex items-center gap-2 rounded-md border px-2 py-1 transition-colors cursor-pointer',
                !childMode && (selected ? 'bg-accent text-accent-foreground border-accent' : 'bg-background')
              )}
              data-selected={childMode ? selected : undefined}
              onClick={() => onLanguageChange(lang.code)}
            >
              <RadioGroupItem value={lang.code} id={id} className={childMode ? 'hidden' : ''} />
              {childMode && <span className="lang-flag" aria-hidden>{FLAG[lang.code]}</span>}
              <label htmlFor={id} className={cn('leading-none cursor-pointer', childMode ? 'text-xs font-semibold' : 'text-sm')}>                {childMode ? lang.name : lang.nativeName}
              </label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
