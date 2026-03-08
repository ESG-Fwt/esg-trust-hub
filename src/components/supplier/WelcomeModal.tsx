import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Upload, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';

const steps = [
  { icon: Leaf, titleKey: 'onboarding.step1Title', descKey: 'onboarding.step1Desc' },
  { icon: Upload, titleKey: 'onboarding.step2Title', descKey: 'onboarding.step2Desc' },
  { icon: FileText, titleKey: 'onboarding.step3Title', descKey: 'onboarding.step3Desc' },
  { icon: CheckCircle, titleKey: 'onboarding.step4Title', descKey: 'onboarding.step4Desc' },
];

export function WelcomeModal() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem('esg-onboarding-seen');
    if (!seen) setOpen(true);
  }, []);

  const handleClose = () => {
    localStorage.setItem('esg-onboarding-seen', 'true');
    setOpen(false);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const current = steps[step];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto">
                <Icon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{t(current.titleKey)}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(current.descKey)}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-1.5 mt-6 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={handleClose} className="flex-1">
              {t('onboarding.skip')}
            </Button>
            <Button size="sm" onClick={handleNext} className="flex-1">
              {step < steps.length - 1 ? (
                <>
                  {t('onboarding.next')} <ArrowRight className="w-4 h-4 ml-1" />
                </>
              ) : (
                t('onboarding.getStarted')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
