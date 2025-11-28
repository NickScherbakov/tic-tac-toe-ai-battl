import { motion, AnimatePresence } from 'framer-motion';
import { Language, t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

interface OnboardingOverlayProps {
  language: Language;
  visible: boolean;
  onClose: () => void;
}

export function OnboardingOverlay({ language, visible, onClose }: OnboardingOverlayProps) {
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
            <h2 className="text-2xl font-bold mb-2 neon-x">{t(language,'onboarding.title')}</h2>
            <ul className="space-y-2 text-sm">
              <li>🪵 {t(language,'onboarding.stepBet')}</li>
              <li>🤖 {t(language,'onboarding.stepStart')}</li>
              <li>👀 {t(language,'onboarding.stepObserve')}</li>
            </ul>
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