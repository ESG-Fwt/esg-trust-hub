import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Flame, Droplets, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWizardStore } from '@/stores/wizardStore';
import { toast } from 'sonner';
import { validateEnergyData } from '@/lib/validationSchemas';

// Field configuration with max limits for display
const FIELD_CONFIG = {
  electricity: { label: 'Electricity', unit: 'kWh', icon: Zap, color: 'text-amber-500', max: 1000000 },
  gas: { label: 'Natural Gas', unit: 'm³', icon: Flame, color: 'text-orange-500', max: 100000 },
  fuel: { label: 'Fuel', unit: 'L', icon: Droplets, color: 'text-blue-500', max: 50000 },
  waste: { label: 'Waste', unit: 'kg', icon: Trash2, color: 'text-slate-500', max: 10000 },
} as const;

type FieldKey = keyof typeof FIELD_CONFIG;

const EnergyDataForm = () => {
  const { manualData, setManualData, nextStep } = useWizardStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      toast.error('Please fix the errors before continuing');
    }
  };

  const handleInputChange = (key: FieldKey, value: string) => {
    // Parse and sanitize: limit to 2 decimal places
    const parsed = parseFloat(value);
    const numValue = isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
    
    // Clamp to max value to prevent overflow
    const maxValue = FIELD_CONFIG[key].max;
    const clampedValue = Math.min(numValue, maxValue);
    
    setManualData({ [key]: clampedValue });
    
    // Clear error for this field if it exists
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
        <h2 className="text-2xl font-bold text-foreground">Energy Consumption Data</h2>
        <p className="text-muted-foreground">
          Enter your monthly energy consumption. You can also upload invoices in the next step for AI extraction.
        </p>
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
                {config.label}
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
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-destructive mt-1"
                >
                  {errors[key]}
                </motion.p>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="pt-4">
        <Button onClick={handleNext} className="w-full h-12 text-base font-medium">
          Continue to Smart Upload
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        💡 Tip: Leave fields at 0 if not applicable. AI can auto-fill from your invoices.
      </p>
    </motion.div>
  );
};

export default EnergyDataForm;
