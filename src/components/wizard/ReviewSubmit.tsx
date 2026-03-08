import { motion } from 'framer-motion';
import { Zap, Flame, Droplets, Trash2, ArrowLeft, Send, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWizardStore } from '@/stores/wizardStore';
import { submissionsApi } from '@/lib/submissions';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const ReviewSubmit = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    manualData,
    aiExtractedData,
    uploadedFilePath,
    prevStep,
    isSubmitting,
    setIsSubmitting,
    setSubmissionComplete,
    resetWizard,
  } = useWizardStore();

  const mergedData = aiExtractedData || manualData;

  const calculateCO2e = () => {
    return Math.round(
      mergedData.electricity * 0.5 + mergedData.gas * 2.0 + mergedData.fuel * 2.5 + mergedData.waste * 0.3
    );
  };

  const fields = [
    { key: 'electricity', labelKey: 'energy.electricity', unit: 'kWh', icon: Zap, color: 'text-amber-500', bgColor: 'bg-amber-50' },
    { key: 'gas', labelKey: 'energy.naturalGas', unit: 'm³', icon: Flame, color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { key: 'fuel', labelKey: 'energy.fuel', unit: 'L', icon: Droplets, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { key: 'waste', labelKey: 'energy.waste', unit: 'kg', icon: Trash2, color: 'text-slate-500', bgColor: 'bg-slate-50' },
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submissionsApi.submit(mergedData, uploadedFilePath ?? undefined);
      setSubmissionComplete(true);
      toast.success(t('review.success'));
      navigate('/submission/success');
    } catch (error: any) {
      toast.error(error?.message ?? 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">{t('review.title')}</h2>
        <p className="text-muted-foreground">{t('review.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, labelKey, unit, icon: Icon, color, bgColor }, index) => {
          const value = mergedData[key as keyof typeof mergedData];
          const isAIFilled = aiExtractedData && aiExtractedData[key as keyof typeof aiExtractedData] > 0;

          return (
            <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="relative">
              {isAIFilled && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute -top-2 -right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg">
                  <Sparkles className="w-3 h-3" />
                  {t('review.aiAutoFilled')}
                </motion.div>
              )}
              <Card className={`${isAIFilled ? 'ring-2 ring-primary/20 ai-shimmer' : ''}`}>
                <CardContent className="pt-4">
                  <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-md ${bgColor} flex items-center justify-center`}>
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                    </div>
                    {t(labelKey)}
                  </Label>
                  <div className="relative">
                    <Input type="number" value={value} readOnly className="h-12 pr-16 text-lg font-semibold bg-muted/50" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">{unit}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
        <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {t('review.carbonFootprint')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold text-primary">{calculateCO2e().toLocaleString()}</span>
              <span className="text-lg text-muted-foreground mb-2">kg CO₂e</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{t('review.emissionFactors')}</p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex gap-4 pt-4">
        <Button variant="outline" onClick={prevStep} className="flex-1 h-12" disabled={isSubmitting}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.back')}
        </Button>
        <Button onClick={handleSubmit} className="flex-1 h-12 text-base font-medium" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              {t('review.submitting')}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              {t('review.submitData')}
            </span>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default ReviewSubmit;
