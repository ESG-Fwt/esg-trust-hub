import { z } from 'zod';
import type { EnergyData } from '@/stores/wizardStore';

// Energy data validation schema with business-reasonable limits
export const energyDataSchema = z.object({
  electricity: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Value must be 0 or greater')
    .max(1000000, 'Value exceeds maximum allowed (1,000,000 kWh)')
    .multipleOf(0.01, 'Maximum 2 decimal places allowed'),
  gas: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Value must be 0 or greater')
    .max(100000, 'Value exceeds maximum allowed (100,000 m³)')
    .multipleOf(0.01, 'Maximum 2 decimal places allowed'),
  fuel: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Value must be 0 or greater')
    .max(50000, 'Value exceeds maximum allowed (50,000 L)')
    .multipleOf(0.01, 'Maximum 2 decimal places allowed'),
  waste: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Value must be 0 or greater')
    .max(10000, 'Value exceeds maximum allowed (10,000 kg)')
    .multipleOf(0.01, 'Maximum 2 decimal places allowed'),
});

export type EnergyDataInput = z.infer<typeof energyDataSchema>;

// Validate and sanitize energy data
export const validateEnergyData = (data: EnergyData) => {
  // Round values to 2 decimal places to enforce precision
  const sanitizedData: EnergyData = {
    electricity: Math.round((data.electricity || 0) * 100) / 100,
    gas: Math.round((data.gas || 0) * 100) / 100,
    fuel: Math.round((data.fuel || 0) * 100) / 100,
    waste: Math.round((data.waste || 0) * 100) / 100,
  };

  return energyDataSchema.safeParse(sanitizedData);
};
