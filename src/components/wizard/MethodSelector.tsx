import { motion } from 'framer-motion';
import { PenLine, Sparkles, ArrowRight } from 'lucide-react';
import { useWizardStore } from '@/stores/wizardStore';
import { useLanguage } from '@/contexts/LanguageContext';

const MethodSelector = () => {
  const { setSubmissionMethod, nextStep } = useWizardStore();
  const { t } = useLanguage();

  const handleSelect = (method: 'manual' | 'smart') => {
    setSubmissionMethod(method);
    nextStep();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">{t('wizard.howSubmit')}</h2>
        <p className="text-muted-foreground">{t('wizard.chooseMethod')}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Manual Entry */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelect('manual')}
          className="group relative flex flex-col items-center p-8 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-accent transition-colors">
            <PenLine className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('wizard.manualEntry')}</h3>
          <p className="text-sm text-muted-foreground text-center">{t('wizard.manualDesc')}</p>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
            {t('wizard.getStarted')} <ArrowRight className="w-4 h-4" />
          </div>
        </motion.button>

        {/* Smart Upload */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelect('smart')}
          className="group relative flex flex-col items-center p-8 rounded-xl border-2 border-primary/20 bg-accent/30 hover:border-primary/50 hover:shadow-lg transition-all text-left"
        >
          <div className="absolute -top-3 right-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              <Sparkles className="w-3 h-3" /> {t('wizard.recommended')}
            </span>
          </div>
          <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('wizard.smartUpload')}</h3>
          <p className="text-sm text-muted-foreground text-center">{t('wizard.smartDesc')}</p>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
            {t('wizard.uploadDoc')} <ArrowRight className="w-4 h-4" />
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MethodSelector;
