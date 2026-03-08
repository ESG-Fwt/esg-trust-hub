import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, FileCheck, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '@/stores/wizardStore';
import { useLanguage } from '@/contexts/LanguageContext';

const SubmissionSuccess = () => {
  const navigate = useNavigate();
  const { resetWizard } = useWizardStore();
  const { t } = useLanguage();

  const handleNewSubmission = () => {
    resetWizard();
    navigate('/supplier/submit');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="max-w-md w-full text-center space-y-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }} className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.4 }} className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
          </motion.div>
        </motion.div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">{t('success.title')}</h1>
          <p className="text-muted-foreground">{t('success.subtitle')}</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-accent/50 border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-status-pending-bg rounded-full flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-status-pending" />
            </div>
            <div>
              <p className="font-medium text-foreground">{t('success.statusPending')}</p>
              <p className="text-sm text-muted-foreground">{t('success.notified')}</p>
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="text-left text-sm text-muted-foreground">
            <p>{t('success.encrypted')}</p>
            <p>{t('success.auditTrail')}</p>
          </div>
        </motion.div>

        <div className="flex flex-col gap-3">
          <Button onClick={handleNewSubmission} className="w-full h-12">
            <ArrowRight className="w-5 h-5 mr-2" />
            {t('success.newSubmission')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/supplier/history')} className="w-full h-12">
            <Home className="w-5 h-5 mr-2" />
            {t('success.viewSubmissions')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SubmissionSuccess;
