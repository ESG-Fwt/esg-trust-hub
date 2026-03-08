import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EnergyData {
  electricity: number;
  gas: number;
  fuel: number;
  waste: number;
}

interface WizardState {
  currentStep: number;
  submissionMethod: 'manual' | 'smart' | null;
  manualData: EnergyData;
  aiExtractedData: EnergyData | null;
  uploadedFileName: string | null;
  uploadedFilePath: string | null;
  isAIProcessing: boolean;
  isSubmitting: boolean;
  submissionComplete: boolean;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSubmissionMethod: (method: 'manual' | 'smart') => void;
  setManualData: (data: Partial<EnergyData>) => void;
  setAIExtractedData: (data: EnergyData) => void;
  setUploadedFileName: (name: string | null) => void;
  setUploadedFilePath: (path: string | null) => void;
  setIsAIProcessing: (processing: boolean) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setSubmissionComplete: (complete: boolean) => void;
  resetWizard: () => void;
}

const initialEnergyData: EnergyData = {
  electricity: 0,
  gas: 0,
  fuel: 0,
  waste: 0,
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      currentStep: 1,
      submissionMethod: null,
      manualData: initialEnergyData,
      aiExtractedData: null,
      uploadedFileName: null,
      uploadedFilePath: null,
      isAIProcessing: false,
      isSubmitting: false,
      submissionComplete: false,

      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 3) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
      setSubmissionMethod: (method) => set({ submissionMethod: method }),
      setManualData: (data) =>
        set((state) => ({ manualData: { ...state.manualData, ...data } })),
      setAIExtractedData: (data) => set({ aiExtractedData: data }),
      setUploadedFileName: (name) => set({ uploadedFileName: name }),
      setUploadedFilePath: (path) => set({ uploadedFilePath: path }),
      setIsAIProcessing: (processing) => set({ isAIProcessing: processing }),
      setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
      setSubmissionComplete: (complete) => set({ submissionComplete: complete }),
      resetWizard: () =>
        set({
          currentStep: 1,
          submissionMethod: null,
          manualData: initialEnergyData,
          aiExtractedData: null,
          uploadedFileName: null,
          uploadedFilePath: null,
          isAIProcessing: false,
          isSubmitting: false,
          submissionComplete: false,
        }),
    }),
    {
      name: 'esg-wizard-storage',
    }
  )
);
