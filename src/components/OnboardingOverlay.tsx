import { motion, AnimatePresence } from 'framer-motion';
import { Language, t } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';

interface OnboardingOverlayProps {
  language: Language;
  visible: boolean;
  onClose: () => void;
  onLanguageChange: (lang: Language) => void;
  childMode?: boolean;
}

export function OnboardingOverlay({ language, visible, onClose, onLanguageChange, childMode }: OnboardingOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card max-w-lg w-full p-8 rounded-xl shadow-xl space-y-5"
          >
            <div className="flex justify-between items-start gap-3 mb-2">
              <h2 className="text-2xl font-bold neon-x flex-1">{t(language,'onboarding.title')}</h2>
              <div className="opacity-90">
                <LanguageSwitcher currentLanguage={language} onLanguageChange={onLanguageChange} childMode={childMode} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{t(language,'subtitle')}</p>
            <ul className="space-y-2 text-sm">
              <li>🪵 {t(language,'onboarding.stepBet')}</li>
              <li>🤖 {t(language,'onboarding.stepStart')}</li>
              <li>👀 {t(language,'onboarding.stepObserve')}</li>
            </ul>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{language === 'en' ? 'You can change language above at any time.' : language === 'ru' ? 'Язык можно поменять сверху в любой момент.' : language === 'ar' ? 'يمكنك تغيير اللغة في الأعلى في أي وقت.' : '可以随时在上方切换语言。'}</p>
            <div className="pt-4 flex justify-end">
              <Button onClick={onClose} className="balance-chip">
                {t(language,'onboarding.close')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}