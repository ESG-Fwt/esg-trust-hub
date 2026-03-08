import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Flame, Droplets, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWizardStore } from '@/stores/wizardStore';
import { toast } from 'sonner';
import { validateEnergyData } from '@/lib/validationSchemas';
import { useLanguage } from '@/contexts/LanguageContext';

const EnergyDataForm = () => {
  const { manualData, setManualData, nextStep, prevStep } = useWizardStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { t } = useLanguage();

  const FIELD_CONFIG = {
    electricity: { labelKey: 'energy.electricity', unit: 'kWh', icon: Zap, color: 'text-amber-500', max: 1000000 },
    gas: { labelKey: 'energy.naturalGas', unit: 'm³', icon: Flame, color: 'text-orange-500', max: 100000 },
    fuel: { labelKey: 'energy.fuel', unit: 'L', icon: Droplets, color: 'text-blue-500', max: 50000 },
    waste: { labelKey: 'energy.waste', unit: 'kg', icon: Trash2, color: 'text-slate-500', max: 10000 },
  } as const;

  type FieldKey = keyof typeof FIELD_CONFIG;
  const fields: FieldKey[] = ['electricity', 'gas', 'fuel', 'waste'];

  const validateForm = (): boolean => {
    const result = validateEnergyData(manualData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        newErrors[field] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (validateForm()) {
      nextStep();
    } else {
      toast.error(t('energy.fixErrors'));
    }
  };

  const handleInputChange = (key: FieldKey, value: string) => {
    const parsed = parseFloat(value);
    const numValue = isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
    const maxValue = FIELD_CONFIG[key].max;
    const clampedValue = Math.min(numValue, maxValue);
    setManualData({ [key]: clampedValue });
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">{t('energy.title')}</h2>
        <p className="text-muted-foreground">{t('energy.subtitle')}</p>
      </div>

      <div className="grid gap-6">
        {fields.map((key, index) => {
          const config = FIELD_CONFIG[key];
          const Icon = config.icon;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Label htmlFor={key} className="text-sm font-medium flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${config.color}`} />
                {t(config.labelKey)}
                <span className="text-xs text-muted-foreground ml-auto">
                  (max: {config.max.toLocaleString()})
                </span>
              </Label>
              <div className="relative">
                <Input
                  id={key}
                  type="number"
                  min="0"
                  max={config.max}
                  step="0.01"
                  placeholder="0.00"
                  value={manualData[key] || ''}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className={`h-12 pr-16 text-lg font-medium ${
                    errors[key] ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  {config.unit}
                </div>
              </div>
              {errors[key] && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive mt-1">
                  {errors[key]}
                </motion.p>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-4 pt-4">
        <Button variant="outline" onClick={prevStep} className="flex-1 h-12">
          <ArrowLeft className="w-5 h-5 mr-2" /> {t('common.back')}
        </Button>
        <Button onClick={handleNext} className="flex-1 h-12 text-base font-medium">
          {t('energy.continueReview')}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {t('energy.leaveZero')}
      </p>
    </motion.div>
  );
};

export default EnergyDataForm;
