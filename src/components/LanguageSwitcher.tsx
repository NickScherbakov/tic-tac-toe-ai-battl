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
  { code: 'ru', name: 'Русский', nativeName: 'Русский' },
  { code: 'ar', name: 'العربية', nativeName: 'العربية' },
  { code: 'zh', name: '中文', nativeName: '中文' },
];

const FLAG: Record<Language,string> = { en: '🇬🇧', ru: '🇷🇺', ar: '🇸🇦', zh: '🇨🇳' };

export function LanguageSwitcher({ currentLanguage, onLanguageChange, childMode }: LanguageSwitcherProps) {
  if (childMode) {
    // Мобильная версия — сетка 2x2
    return (
      <div className="grid grid-cols-2 gap-3">
        {languages.map((lang) => {
          const selected = currentLanguage === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all',
                selected 
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-purple-500/25' 
                  : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'
              )}
            >
              <span className="text-xl">{FLAG[lang.code]}</span>
              <span className="text-sm">{lang.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Десктопная версия
  return (
    <div className="flex items-center gap-2 lang-wrapper">      
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
              className={cn(
                'flex items-center gap-2 rounded-md border px-2 py-1 transition-colors cursor-pointer',
                selected ? 'bg-accent text-accent-foreground border-accent' : 'bg-background'
              )}
              onClick={() => onLanguageChange(lang.code)}
            >
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
