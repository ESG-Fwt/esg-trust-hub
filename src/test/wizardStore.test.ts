import { describe, it, expect, beforeEach } from 'vitest';
import { useWizardStore } from '@/stores/wizardStore';

describe('wizardStore', () => {
  beforeEach(() => {
    useWizardStore.getState().resetWizard();
  });

  it('initializes with correct defaults', () => {
    const state = useWizardStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.submissionMethod).toBeNull();
    expect(state.manualData).toEqual({ electricity: 0, gas: 0, fuel: 0, waste: 0, water: 0 });
    expect(state.aiExtractedData).toBeNull();
    expect(state.isSubmitting).toBe(false);
    expect(state.submissionComplete).toBe(false);
    expect(state.periodStart).toBeNull();
    expect(state.periodEnd).toBeNull();
  });

  it('nextStep increments step but caps at 3', () => {
    const store = useWizardStore.getState();
    store.nextStep();
    expect(useWizardStore.getState().currentStep).toBe(2);
    store.nextStep();
    expect(useWizardStore.getState().currentStep).toBe(3);
    useWizardStore.getState().nextStep();
    expect(useWizardStore.getState().currentStep).toBe(3); // capped
  });

  it('prevStep decrements step but floors at 1', () => {
    useWizardStore.getState().setStep(3);
    useWizardStore.getState().prevStep();
    expect(useWizardStore.getState().currentStep).toBe(2);
    useWizardStore.getState().prevStep();
    expect(useWizardStore.getState().currentStep).toBe(1);
    useWizardStore.getState().prevStep();
    expect(useWizardStore.getState().currentStep).toBe(1); // floored
  });

  it('setManualData merges partial data', () => {
    useWizardStore.getState().setManualData({ electricity: 500 });
    expect(useWizardStore.getState().manualData.electricity).toBe(500);
    expect(useWizardStore.getState().manualData.gas).toBe(0); // unchanged

    useWizardStore.getState().setManualData({ gas: 200, fuel: 100 });
    expect(useWizardStore.getState().manualData.gas).toBe(200);
    expect(useWizardStore.getState().manualData.fuel).toBe(100);
    expect(useWizardStore.getState().manualData.electricity).toBe(500); // still 500
  });

  it('setSubmissionMethod sets method correctly', () => {
    useWizardStore.getState().setSubmissionMethod('smart');
    expect(useWizardStore.getState().submissionMethod).toBe('smart');
    useWizardStore.getState().setSubmissionMethod('manual');
    expect(useWizardStore.getState().submissionMethod).toBe('manual');
  });

  it('setAIExtractedData stores data', () => {
    const data = { electricity: 100, gas: 50, fuel: 25, waste: 10, water: 5 };
    useWizardStore.getState().setAIExtractedData(data);
    expect(useWizardStore.getState().aiExtractedData).toEqual(data);
  });

  it('resetWizard clears all state', () => {
    useWizardStore.getState().setStep(3);
    useWizardStore.getState().setManualData({ electricity: 500 });
    useWizardStore.getState().setSubmissionMethod('smart');
    useWizardStore.getState().setIsSubmitting(true);
    useWizardStore.getState().setPeriodStart('2026-01-01');

    useWizardStore.getState().resetWizard();

    const state = useWizardStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.submissionMethod).toBeNull();
    expect(state.manualData.electricity).toBe(0);
    expect(state.isSubmitting).toBe(false);
    expect(state.periodStart).toBeNull();
  });

  it('period start/end can be set and cleared', () => {
    useWizardStore.getState().setPeriodStart('2026-01-01');
    useWizardStore.getState().setPeriodEnd('2026-03-31');
    expect(useWizardStore.getState().periodStart).toBe('2026-01-01');
    expect(useWizardStore.getState().periodEnd).toBe('2026-03-31');

    useWizardStore.getState().setPeriodStart(null);
    expect(useWizardStore.getState().periodStart).toBeNull();
  });
});
