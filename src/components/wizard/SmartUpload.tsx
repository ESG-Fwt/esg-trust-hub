import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle2, Sparkles, Shield, Brain, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWizardStore } from '@/stores/wizardStore';
import { mockApi } from '@/lib/mockApi';
import { toast } from 'sonner';

type ProcessingStage = 'idle' | 'uploading' | 'scanning' | 'extracting' | 'complete';

const SmartUpload = () => {
  const { setAIExtractedData, setUploadedFileName, nextStep, prevStep, setIsAIProcessing } = useWizardStore();
  const [isDragActive, setIsDragActive] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
  const [fileName, setFileName] = useState<string | null>(null);

  const processingStages = [
    { key: 'uploading', label: 'Uploading file...', icon: Upload },
    { key: 'scanning', label: 'Scanning for malware...', icon: Shield },
    { key: 'extracting', label: 'AI extracting data...', icon: Brain },
    { key: 'complete', label: 'Extraction complete!', icon: CheckCircle2 },
  ];

  const simulateProcessing = async (file: File) => {
    setFileName(file.name);
    setUploadedFileName(file.name);
    setIsAIProcessing(true);

    // Stage 1: Uploading
    setProcessingStage('uploading');
    await new Promise((r) => setTimeout(r, 800));

    // Stage 2: Scanning
    setProcessingStage('scanning');
    await new Promise((r) => setTimeout(r, 600));

    // Stage 3: AI Extraction
    setProcessingStage('extracting');
    const result = await mockApi.ai.extract('mock-url');

    // Stage 4: Complete
    setProcessingStage('complete');
    setAIExtractedData(result.data);
    setIsAIProcessing(false);

    toast.success('AI successfully extracted energy data from your document!');
    
    // Auto-advance after showing success
    await new Promise((r) => setTimeout(r, 1000));
    nextStep();
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
        simulateProcessing(file);
      } else {
        toast.error('Please upload a PDF or image file');
      }
    },
    [simulateProcessing]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      simulateProcessing(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const currentStageIndex = processingStages.findIndex((s) => s.key === processingStage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-2">
          <Sparkles className="w-4 h-4" />
          AI-Powered
        </div>
        <h2 className="text-2xl font-bold text-foreground">Smart Document Upload</h2>
        <p className="text-muted-foreground">
          Upload your energy invoices and our AI will automatically extract the data
        </p>
      </div>

      <AnimatePresence mode="wait">
        {processingStage === 'idle' ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <label
              htmlFor="file-upload"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`upload-zone cursor-pointer flex flex-col items-center justify-center p-12 ${
                isDragActive ? 'active border-primary' : 'border-border'
              }`}
            >
              <motion.div
                animate={{ scale: isDragActive ? 1.1 : 1 }}
                className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4"
              >
                <Upload className="w-8 h-8 text-primary" />
              </motion.div>
              <p className="text-lg font-medium text-foreground mb-1">
                {isDragActive ? 'Drop your file here' : 'Drag & drop your invoice'}
              </p>
              <p className="text-sm text-muted-foreground">or click to browse (PDF, PNG, JPG)</p>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </motion.div>
        ) : (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-8"
          >
            {/* File Info */}
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{fileName}</p>
                <p className="text-sm text-muted-foreground">Processing document...</p>
              </div>
            </div>

            {/* Processing Stages */}
            <div className="space-y-4">
              {processingStages.map((stage, index) => {
                const isActive = stage.key === processingStage;
                const isComplete = index < currentStageIndex;
                const isPending = index > currentStageIndex;

                return (
                  <motion.div
                    key={stage.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-accent' : ''
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isComplete
                          ? 'bg-primary text-primary-foreground'
                          : isActive
                          ? 'bg-primary text-primary-foreground animate-pulse-soft'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <stage.icon className={`w-5 h-5 ${isActive ? 'animate-spin-slow' : ''}`} />
                      )}
                    </div>
                    <span
                      className={`font-medium ${
                        isPending ? 'text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="mt-6 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStageIndex + 1) / processingStages.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {processingStage === 'idle' && (
        <div className="flex gap-4">
          <Button variant="outline" onClick={prevStep} className="flex-1 h-12">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <Button variant="ghost" onClick={nextStep} className="flex-1 h-12">
            Skip to Review
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default SmartUpload;
