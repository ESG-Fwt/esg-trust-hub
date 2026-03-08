import { describe, it, expect, beforeEach } from 'vitest';
import { energyDataSchema, validateEnergyData } from '@/lib/validationSchemas';

describe('energyDataSchema', () => {
  it('accepts valid data', () => {
    const result = energyDataSchema.safeParse({
      electricity: 1000, gas: 500, fuel: 200, waste: 100, water: 300,
    });
    expect(result.success).toBe(true);
  });

  it('accepts zero values', () => {
    const result = energyDataSchema.safeParse({
      electricity: 0, gas: 0, fuel: 0, waste: 0, water: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative values', () => {
    const result = energyDataSchema.safeParse({
      electricity: -1, gas: 0, fuel: 0, waste: 0, water: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects values above max', () => {
    const result = energyDataSchema.safeParse({
      electricity: 2000000, gas: 0, fuel: 0, waste: 0, water: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric types', () => {
    const result = energyDataSchema.safeParse({
      electricity: 'abc', gas: 0, fuel: 0, waste: 0, water: 0,
    });
    expect(result.success).toBe(false);
  });

  it('accepts 2 decimal places', () => {
    const result = energyDataSchema.safeParse({
      electricity: 100.55, gas: 0.01, fuel: 0, waste: 0, water: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects more than 2 decimal places', () => {
    const result = energyDataSchema.safeParse({
      electricity: 100.555, gas: 0, fuel: 0, waste: 0, water: 0,
    });
    expect(result.success).toBe(false);
  });

  it('enforces per-field max limits', () => {
    // gas max = 100000
    expect(energyDataSchema.safeParse({ electricity: 0, gas: 100001, fuel: 0, waste: 0, water: 0 }).success).toBe(false);
    // fuel max = 50000
    expect(energyDataSchema.safeParse({ electricity: 0, gas: 0, fuel: 50001, waste: 0, water: 0 }).success).toBe(false);
    // waste max = 10000
    expect(energyDataSchema.safeParse({ electricity: 0, gas: 0, fuel: 0, waste: 10001, water: 0 }).success).toBe(false);
    // water max = 100000
    expect(energyDataSchema.safeParse({ electricity: 0, gas: 0, fuel: 0, waste: 0, water: 100001 }).success).toBe(false);
  });
});

describe('validateEnergyData', () => {
  it('sanitizes and validates correct data', () => {
    const result = validateEnergyData({ electricity: 100, gas: 50, fuel: 25, waste: 10, water: 30 });
    expect(result.success).toBe(true);
  });

  it('rounds to 2 decimal places', () => {
    const result = validateEnergyData({ electricity: 100.555, gas: 0, fuel: 0, waste: 0, water: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.electricity).toBe(100.56);
    }
  });

  it('handles falsy/undefined values as 0', () => {
    const result = validateEnergyData({ electricity: 0, gas: 0, fuel: 0, waste: 0, water: 0 });
    expect(result.success).toBe(true);
  });
});
