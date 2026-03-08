import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '@/stores/wizardStore';
import { useAuthStore } from '@/stores/authStore';
import Stepper from '@/components/wizard/Stepper';
import EnergyDataForm from '@/components/wizard/EnergyDataForm';
import SmartUpload from '@/components/wizard/SmartUpload';
import ReviewSubmit from '@/components/wizard/ReviewSubmit';

const steps = [
  { title: 'Energy Data', description: 'Enter consumption' },
  { title: 'Smart Upload', description: 'AI extraction' },
  { title: 'Review', description: 'Submit data' },
];

const SubmissionWizard = () => {
  const navigate = useNavigate();
  const { profile, logout } = useAuthStore();
  const { currentStep, resetWizard } = useWizardStore();

  const handleLogout = async () => {
    await logout();
    resetWizard();
    navigate('/login');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <EnergyDataForm />;
      case 2: return <SmartUpload />;
      case 3: return <ReviewSubmit />;
      default: return <EnergyDataForm />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-semibold text-foreground">ESG Chain</span>
              <p className="text-xs text-muted-foreground">Supplier Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <Stepper currentStep={currentStep} steps={steps} />
        </div>
        <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
          {renderStep()}
        </motion.div>
      </main>

      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 ESG Chain. All data is encrypted and stored securely.
        </div>
      </footer>
    </div>
  );
};

export default SubmissionWizard;
