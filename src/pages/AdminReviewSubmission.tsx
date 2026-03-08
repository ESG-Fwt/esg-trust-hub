import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '@/lib/submissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, FileText, Download, Shield, CheckCircle, RotateCcw,
  Zap, Flame, Droplets, Trash2, Droplet, Hash, Calendar, User, Loader2, PackageCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const AdminReviewSubmission = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  const statusConfig = {
    pending: { label: t('adminReview.pendingReview'), className: 'bg-status-pending-bg text-status-pending border-status-pending/30' },
    approved: { label: t('adminReview.approved'), className: 'bg-status-approved-bg text-status-approved border-status-approved/30' },
    rejected: { label: t('adminReview.revisionRequested'), className: 'bg-status-rejected-bg text-status-rejected border-status-rejected/30' },
  } as const;

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => submissionsApi.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!submission?.file_url) {
      setFilePreviewUrl(null);
      return;
    }
    supabase.storage.from('submissions').createSignedUrl(submission.file_url, 600).then(({ data }) => {
      setFilePreviewUrl(data?.signedUrl ?? null);
    });
  }, [submission?.file_url]);

  const updateMutation = useMutation({
    mutationFn: ({ status, notes }: { status: 'approved' | 'rejected'; notes?: string }) =>
      submissionsApi.updateStatus(id!, status, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (variables.status === 'approved') {
        toast.success(t('adminReview.approvedSuccess'));
      } else {
        toast.info(t('adminReview.revisionSuccess'));
      }
      navigate('/admin/dashboard');
    },
  });

  const handleApprove = () => {
    updateMutation.mutate({ status: 'approved' });
  };

  const handleRevisionSubmit = () => {
    if (!revisionNotes.trim()) {
      toast.error(t('adminReview.provideReason'));
      return;
    }
    updateMutation.mutate({ status: 'rejected', notes: revisionNotes.trim() });
  };

  const [exporting, setExporting] = useState(false);

  const handleExportAuditPackage = useCallback(async () => {
    if (!submission) return;
    setExporting(true);
    try {
      const zip = new JSZip();

      // 1. CSV data
      const csvHeaders = ['Field', 'Value', 'Unit'];
      const csvRows = [
        ['Submission ID', submission.id, ''],
        ['Supplier', submission.supplier_name ?? 'Unknown', ''],
        ['Date', new Date(submission.created_at).toISOString(), ''],
        ['Period Start', submission.period_start ?? '', ''],
        ['Period End', submission.period_end ?? '', ''],
        ['Status', submission.status, ''],
        ['Electricity', String(submission.electricity), 'kWh'],
        ['Natural Gas', String(submission.gas), 'm³'],
        ['Fuel', String(submission.fuel), 'L'],
        ['Waste', String(submission.waste), 'kg'],
        ['Water', String(submission.water), 'm³'],
        ['Total CO₂e', String(submission.total_emissions), 'kg'],
        ['Audit Hash', submission.audit_hash ?? 'N/A', ''],
        ['Verified At', submission.verified_at ?? 'N/A', ''],
      ];
      const csvContent = [csvHeaders.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
      zip.file('submission-data.csv', csvContent);

      // 2. Audit metadata
      const auditMeta = {
        exported_at: new Date().toISOString(),
        submission_id: submission.id,
        supplier: submission.supplier_name,
        status: submission.status,
        audit_hash: submission.audit_hash,
        verified_at: submission.verified_at,
        total_emissions_kg_co2e: submission.total_emissions,
        note: 'This package was generated by ESG Chain for external audit purposes. The audit hash ensures data integrity.',
      };
      zip.file('audit-metadata.json', JSON.stringify(auditMeta, null, 2));

      // 3. Original evidence file (PDF/image)
      if (submission.file_url) {
        const { data: signedData } = await supabase.storage
          .from('submissions')
          .createSignedUrl(submission.file_url, 120);
        if (signedData?.signedUrl) {
          const fileResp = await fetch(signedData.signedUrl);
          if (fileResp.ok) {
            const blob = await fileResp.blob();
            const ext = submission.file_url.split('.').pop() ?? 'pdf';
            zip.file(`evidence-document.${ext}`, blob);
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const safeName = (submission.supplier_name ?? 'supplier').replace(/[^a-zA-Z0-9]/g, '-');
      saveAs(zipBlob, `audit-package-${safeName}-${submission.id.slice(0, 8)}.zip`);
      toast.success(t('adminReview.auditExported'));
    } catch (err) {
      console.error('Export failed', err);
      toast.error(t('adminReview.auditExportFailed'));
    } finally {
      setExporting(false);
    }
  }, [submission, t]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh] gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">{t('adminReview.loadingSubmission')}</span>
        </div>
      </AdminLayout>
    );
  }

  if (!submission) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-muted-foreground">{t('adminReview.notFound')}</p>
          <Button variant="outline" onClick={() => navigate('/admin/submissions')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> {t('adminReview.backToSubmissions')}
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const status = statusConfig[submission.status as keyof typeof statusConfig] ?? statusConfig.pending;

  const vsmeData = [
    { label: t('energy.electricity'), value: Number(submission.electricity), unit: 'kWh', icon: Zap, iconColor: 'text-yellow-500', bgColor: 'bg-yellow-50' },
    { label: t('energy.naturalGas'), value: Number(submission.gas), unit: 'm³', icon: Flame, iconColor: 'text-orange-500', bgColor: 'bg-orange-50' },
    { label: t('energy.fuel'), value: Number(submission.fuel), unit: 'L', icon: Droplets, iconColor: 'text-blue-500', bgColor: 'bg-blue-50' },
    { label: t('energy.waste'), value: Number(submission.waste), unit: 'kg', icon: Trash2, iconColor: 'text-muted-foreground', bgColor: 'bg-muted' },
    { label: t('energy.water'), value: Number(submission.water), unit: 'm³', icon: Droplet, iconColor: 'text-cyan-500', bgColor: 'bg-cyan-50' },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 pb-5 border-b border-border shrink-0"
        >
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard')} className="shrink-0">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> {t('adminReview.backToDashboard')}
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground truncate">
                {submission.supplier_name ?? t('adminReview.unknownSupplier')}
              </h1>
              <Badge variant="outline" className={status.className}>{status.label}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{submission.id.slice(0, 8)}</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(submission.created_at).toLocaleDateString()}
              </span>
              {submission.period_start && submission.period_end && (
                <span className="flex items-center gap-1">
                  {t('energy.period')}: {submission.period_start} → {submission.period_end}
                </span>
              )}
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{submission.supplier_name ?? t('common.unknown')}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportAuditPackage} disabled={exporting} className="shrink-0">
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PackageCheck className="w-4 h-4 mr-2" />}
            {t('adminReview.exportAuditPackage')}
          </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-0 pt-6 pb-24 overflow-y-auto">
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                  {t('adminReview.vsmeData')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {vsmeData.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-md ${item.bgColor} flex items-center justify-center`}>
                        <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                      </div>
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-semibold text-foreground">{item.value.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">{item.unit}</span>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="border-primary/20 bg-accent">
                <CardContent className="pt-5 pb-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    {t('adminReview.totalEmissions')}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-mono text-primary">
                      {Number(submission.total_emissions).toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">kg CO₂e</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{t('adminReview.formula')}</p>
                </CardContent>
              </Card>
            </motion.div>

            {submission.revision_notes && (
              <Card className="border-destructive/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> {t('adminReview.revisionNotes')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{submission.revision_notes}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                  {t('adminReview.auditTrail')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">{t('adminReview.submitted')}</span>
                  <span className="font-medium text-foreground">{new Date(submission.created_at).toLocaleString()}</span>
                </div>
                {submission.verified_at && (
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">{t('adminReview.verified')}</span>
                    <span className="font-medium text-foreground">{new Date(submission.verified_at).toLocaleString()}</span>
                  </div>
                )}
                {submission.audit_hash && (
                  <div className="p-3 bg-status-approved-bg rounded-lg border border-status-approved/20 mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-3.5 h-3.5 text-status-approved" />
                      <span className="text-xs font-semibold text-status-approved">{t('adminReview.auditHash')}</span>
                    </div>
                    <code className="text-[10px] font-mono text-muted-foreground break-all leading-relaxed block">
                      {submission.audit_hash}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="flex flex-col h-full">
              <CardHeader className="pb-3 shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    {t('adminReview.evidence')}
                  </CardTitle>
                  {filePreviewUrl && (
                    <a href={filePreviewUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        <Download className="w-3.5 h-3.5 mr-1.5" /> {t('adminReview.downloadOriginal')}
                      </Button>
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <div className="w-full h-full min-h-[500px] bg-muted/50 rounded-lg border-2 border-dashed border-border overflow-hidden">
                  {filePreviewUrl ? (
                    submission.file_url?.endsWith('.pdf') ? (
                      <iframe src={filePreviewUrl} className="w-full h-full min-h-[500px]" title="PDF Viewer" />
                    ) : (
                      <img src={filePreviewUrl} alt="Uploaded evidence" className="w-full h-full object-contain p-4" />
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <FileText className="w-8 h-8 opacity-40" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{t('adminReview.noDocument')}</p>
                        <p className="text-xs mt-1">{t('adminReview.noDocumentHint')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {submission.status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm"
          >
            <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t('adminReview.reviewComplete')}</p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setRevisionModalOpen(true)}
                  disabled={updateMutation.isPending}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> {t('adminReview.requestRevision')}
                </Button>
                <Button
                  size="default"
                  onClick={handleApprove}
                  disabled={updateMutation.isPending}
                  className="bg-status-approved hover:bg-status-approved/90 text-white min-w-[180px]"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {t('adminReview.approveSubmission')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <Dialog open={revisionModalOpen} onOpenChange={setRevisionModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('adminReview.requestRevision')}</DialogTitle>
              <DialogDescription>{t('adminReview.revisionReason')}</DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder={t('adminReview.revisionPlaceholder')}
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setRevisionModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevisionSubmit}
                disabled={updateMutation.isPending || !revisionNotes.trim()}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                {t('adminReview.submitRevision')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminReviewSubmission;
