import { SupplierLayout } from '@/components/supplier/SupplierLayout';
import { motion } from 'framer-motion';
import { useWizardStore } from '@/stores/wizardStore';
import Stepper from '@/components/wizard/Stepper';
import EnergyDataForm from '@/components/wizard/EnergyDataForm';
import SmartUpload from '@/components/wizard/SmartUpload';
import ReviewSubmit from '@/components/wizard/ReviewSubmit';

const steps = [
  { title: 'Energy Data', description: 'Enter consumption' },
  { title: 'Smart Upload', description: 'AI extraction' },
  { title: 'Review', description: 'Submit data' },
];

const SupplierSubmit = () => {
  const { currentStep } = useWizardStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <EnergyDataForm />;
      case 2: return <SmartUpload />;
      case 3: return <ReviewSubmit />;
      default: return <EnergyDataForm />;
    }
  };

  return (
    <SupplierLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">New Submission</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit your energy consumption data for ESG reporting</p>
        </div>
        <div className="mb-10">
          <Stepper currentStep={currentStep} steps={steps} />
        </div>
        <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
          {renderStep()}
        </motion.div>
      </div>
    </SupplierLayout>
  );
};

export default SupplierSubmit;
