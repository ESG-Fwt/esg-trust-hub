import { SupplierLayout } from '@/components/supplier/SupplierLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useWizardStore } from '@/stores/wizardStore';
import Stepper from '@/components/wizard/Stepper';
import MethodSelector from '@/components/wizard/MethodSelector';
import EnergyDataForm from '@/components/wizard/EnergyDataForm';
import SmartUpload from '@/components/wizard/SmartUpload';
import ReviewSubmit from '@/components/wizard/ReviewSubmit';
import { useLanguage } from '@/contexts/LanguageContext';
import { WelcomeModal } from '@/components/supplier/WelcomeModal';

const SupplierSubmit = () => {
  const { currentStep, submissionMethod } = useWizardStore();
  const { t } = useLanguage();

  const steps = [
    { title: t('wizard.stepMethod'), description: t('wizard.stepMethodDesc') },
    { title: t('wizard.stepData'), description: t('wizard.stepDataDesc') },
    { title: t('wizard.stepReview'), description: t('wizard.stepReviewDesc') },
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <MethodSelector />;
      case 2:
        return submissionMethod === 'smart' ? <SmartUpload /> : <EnergyDataForm />;
      case 3:
        return <ReviewSubmit />;
      default:
        return <MethodSelector />;
    }
  };

  return (
    <SupplierLayout>
      <WelcomeModal />
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{t('submit.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('submit.subtitle')}</p>
        </div>
        <div className="mb-10">
          <Stepper currentStep={currentStep} steps={steps} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </SupplierLayout>
  );
};

export default SupplierSubmit;
