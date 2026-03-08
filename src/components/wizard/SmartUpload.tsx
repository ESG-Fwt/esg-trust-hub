import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle2, Sparkles, Shield, Brain, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWizardStore } from '@/stores/wizardStore';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

type ProcessingStage = 'idle' | 'uploading' | 'scanning' | 'extracting' | 'complete' | 'error';

const SmartUpload = () => {
  const { setAIExtractedData, setUploadedFileName, nextStep, prevStep, setIsAIProcessing } = useWizardStore();
  const [isDragActive, setIsDragActive] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { t } = useLanguage();

  const processingStages = [
    { key: 'uploading', label: t('smart.uploading'), icon: Upload },
    { key: 'scanning', label: t('smart.scanning'), icon: Shield },
    { key: 'extracting', label: t('smart.extracting'), icon: Brain },
    { key: 'complete', label: t('smart.complete'), icon: CheckCircle2 },
  ];

  const processFile = async (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      toast.error(t('smart.fileTooLarge'));
      return;
    }

    setFileName(file.name);
    setUploadedFileName(file.name);
    setIsAIProcessing(true);
    setErrorMessage('');

    try {
      setProcessingStage('uploading');
      await new Promise((r) => setTimeout(r, 400));
      setProcessingStage('scanning');
      await new Promise((r) => setTimeout(r, 300));
      setProcessingStage('extracting');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${supabaseUrl}/functions/v1/extract-energy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${supabaseKey}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) throw new Error('Rate limit exceeded.');
        if (response.status === 402) throw new Error('AI usage limit reached.');
        if (response.status === 413) throw new Error(t('smart.fileTooLarge'));
        throw new Error(errorData?.error || 'AI extraction failed');
      }

      const data = await response.json();
      if (!data?.success) throw new Error(data?.error || 'Could not extract data');

      setProcessingStage('complete');
      setAIExtractedData(data.data);
      setConfidence(data.confidence);
      setNotes(data.notes || '');
      setIsAIProcessing(false);

      toast.success(`AI extracted energy data (${Math.round((data.confidence ?? 0) * 100)}% ${t('smart.confidence').toLowerCase()})`);
      await new Promise((r) => setTimeout(r, 1200));
      nextStep();
    } catch (err: any) {
      setProcessingStage('error');
      setIsAIProcessing(false);
      setErrorMessage(err?.message ?? 'AI extraction failed.');
      toast.error(err?.message ?? 'AI extraction failed.');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      processFile(file);
    } else {
      toast.error(t('smart.pdfOrImage'));
    }
  }, [t]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleSwitchToManual = () => {
    const { setSubmissionMethod } = useWizardStore.getState();
    setSubmissionMethod('manual');
  };

  const currentStageIndex = processingStages.findIndex((s) => s.key === processingStage);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-2">
          <Sparkles className="w-4 h-4" />
          {t('smart.aiPowered')}
        </div>
        <h2 className="text-2xl font-bold text-foreground">{t('smart.title')}</h2>
        <p className="text-muted-foreground">{t('smart.subtitle')}</p>
      </div>

      <AnimatePresence mode="wait">
        {processingStage === 'idle' || processingStage === 'error' ? (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {processingStage === 'error' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 mb-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">{t('smart.failed')}</p>
                  <p className="text-xs text-muted-foreground">{errorMessage || t('smart.failedHint')}</p>
                </div>
              </motion.div>
            )}
            <label
              htmlFor="file-upload"
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }}
              className={`upload-zone cursor-pointer flex flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed transition-colors ${isDragActive ? 'border-primary bg-accent/50' : 'border-border hover:border-primary/40'}`}
            >
              <motion.div animate={{ scale: isDragActive ? 1.1 : 1 }} className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </motion.div>
              <p className="text-lg font-medium text-foreground mb-1">{isDragActive ? t('smart.dropHere') : t('smart.dragDrop')}</p>
              <p className="text-sm text-muted-foreground">{t('smart.orBrowse')}</p>
              <input id="file-upload" type="file" accept=".pdf,image/*" onChange={handleFileSelect} className="hidden" />
            </label>
          </motion.div>
        ) : (
          <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-xl p-8">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{fileName}</p>
                <p className="text-sm text-muted-foreground">{t('smart.processing')}</p>
              </div>
            </div>

            <div className="space-y-4">
              {processingStages.map((stage, index) => {
                const isActive = stage.key === processingStage;
                const isComplete = index < currentStageIndex;
                const isPending = index > currentStageIndex;

                return (
                  <motion.div key={stage.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${isActive ? 'bg-accent' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isComplete ? 'bg-primary text-primary-foreground' : isActive ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <stage.icon className="w-5 h-5" />}
                    </div>
                    <span className={`font-medium ${isPending ? 'text-muted-foreground' : 'text-foreground'}`}>{stage.label}</span>
                  </motion.div>
                );
              })}
            </div>

            {confidence !== null && processingStage === 'complete' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 bg-accent rounded-lg text-sm">
                <p className="text-foreground font-medium">{t('smart.confidence')}: {Math.round(confidence * 100)}%</p>
                {notes && <p className="text-muted-foreground text-xs mt-1">{notes}</p>}
              </motion.div>
            )}

            <div className="mt-6 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div initial={{ width: '0%' }} animate={{ width: `${((currentStageIndex + 1) / processingStages.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }} className="h-full bg-primary rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(processingStage === 'idle' || processingStage === 'error') && (
        <div className="flex gap-4">
          <Button variant="outline" onClick={prevStep} className="flex-1 h-12">
            <ArrowLeft className="w-5 h-5 mr-2" /> {t('common.back')}
          </Button>
          <Button variant="ghost" onClick={handleSwitchToManual} className="flex-1 h-12">
            {t('smart.manualInstead')}
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default SmartUpload;
