import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '@/lib/submissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, FileText, Download, Shield, CheckCircle, RotateCcw,
  Zap, Flame, Droplets, Trash2, Droplet, Hash, Calendar, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const statusConfig = {
  pending: { label: 'Pending Review', className: 'bg-status-pending-bg text-status-pending border-status-pending/30' },
  approved: { label: 'Approved', className: 'bg-status-approved-bg text-status-approved border-status-approved/30' },
  rejected: { label: 'Revision Requested', className: 'bg-status-rejected-bg text-status-rejected border-status-rejected/30' },
} as const;

const AdminReviewSubmission = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions'],
    queryFn: submissionsApi.getWithProfiles,
  });

  const submission = submissions?.find((s) => s.id === id);

  useEffect(() => {
    if (!submission?.file_url) {
      setFilePreviewUrl(null);
      return;
    }
    supabase.storage.from('submissions').createSignedUrl(submission.file_url, 300).then(({ data }) => {
      setFilePreviewUrl(data?.signedUrl ?? null);
    });
  }, [submission?.file_url]);

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      submissionsApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (variables.status === 'approved') {
        toast.success('Submission approved successfully.');
      } else {
        toast.info('Revision requested — supplier will be notified.');
      }
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-muted-foreground text-sm">Loading submission…</div>
        </div>
      </AdminLayout>
    );
  }

  if (!submission) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-muted-foreground">Submission not found</p>
          <Button variant="outline" onClick={() => navigate('/admin/submissions')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Submissions
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const status = statusConfig[submission.status as keyof typeof statusConfig] ?? statusConfig.pending;

  const vsmeData = [
    { label: 'Electricity', value: Number(submission.electricity), unit: 'kWh', icon: Zap, iconColor: 'text-yellow-500', bgColor: 'bg-yellow-50' },
    { label: 'Natural Gas', value: Number(submission.gas), unit: 'm³', icon: Flame, iconColor: 'text-orange-500', bgColor: 'bg-orange-50' },
    { label: 'Fuel', value: Number(submission.fuel), unit: 'L', icon: Droplets, iconColor: 'text-blue-500', bgColor: 'bg-blue-50' },
    { label: 'Waste', value: Number(submission.waste), unit: 'kg', icon: Trash2, iconColor: 'text-muted-foreground', bgColor: 'bg-muted' },
    { label: 'Water', value: 0, unit: 'm³', icon: Droplet, iconColor: 'text-cyan-500', bgColor: 'bg-cyan-50' },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
        {/* ── Top Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 pb-5 border-b border-border shrink-0"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Dashboard
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground truncate">
                {submission.supplier_name ?? 'Unknown Supplier'}
              </h1>
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {submission.id.slice(0, 8)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(submission.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {submission.supplier_name ?? 'Unknown'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Main Content: 50/50 Split ── */}
        <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-0 pt-6 pb-24 overflow-y-auto">
          {/* Left Column — VSME Data */}
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                  VSME Extracted Data
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
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {item.value.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1.5">{item.unit}</span>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Total Emissions */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="border-primary/20 bg-accent">
                <CardContent className="pt-5 pb-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Total Calculated Emissions
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-mono text-primary">
                      {Number(submission.total_emissions).toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">kg CO₂e</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Formula: Electricity × 0.5 + Gas × 2.0 + Fuel × 2.5 + Waste × 0.3
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Audit Trail */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                  Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Submitted</span>
                  <span className="font-medium text-foreground">{new Date(submission.created_at).toLocaleString()}</span>
                </div>
                {submission.verified_at && (
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Verified</span>
                    <span className="font-medium text-foreground">{new Date(submission.verified_at).toLocaleString()}</span>
                  </div>
                )}
                {submission.audit_hash && (
                  <div className="p-3 bg-status-approved-bg rounded-lg border border-status-approved/20 mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-3.5 h-3.5 text-status-approved" />
                      <span className="text-xs font-semibold text-status-approved">Immutable Audit Hash</span>
                    </div>
                    <code className="text-[10px] font-mono text-muted-foreground break-all leading-relaxed block">
                      {submission.audit_hash}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column — Evidence / PDF Viewer */}
          <div className="space-y-4">
            <Card className="flex flex-col h-full">
              <CardHeader className="pb-3 shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    Supporting Evidence
                  </CardTitle>
                  {filePreviewUrl && (
                    <a href={filePreviewUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Download Original
                      </Button>
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <div className="w-full h-full min-h-[500px] bg-muted/50 rounded-lg border-2 border-dashed border-border overflow-hidden">
                  {filePreviewUrl ? (
                    submission.file_url?.endsWith('.pdf') ? (
                      <iframe
                        src={filePreviewUrl}
                        className="w-full h-full min-h-[500px] rounded-lg"
                        title="PDF Document Viewer"
                      />
                    ) : (
                      <img
                        src={filePreviewUrl}
                        alt="Uploaded evidence"
                        className="w-full h-full object-contain p-4"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <FileText className="w-8 h-8 opacity-40" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">No document uploaded</p>
                        <p className="text-xs mt-1">The supplier did not attach a file to this submission</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Bottom Action Bar (sticky) ── */}
        {submission.status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm"
          >
            <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Review complete? Choose an action below.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => updateMutation.mutate({ id: submission.id, status: 'rejected' })}
                  disabled={updateMutation.isPending}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Request Revision
                </Button>
                <Button
                  size="default"
                  onClick={() => updateMutation.mutate({ id: submission.id, status: 'approved' })}
                  disabled={updateMutation.isPending}
                  className="bg-status-approved hover:bg-status-approved/90 text-white min-w-[180px]"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Submission
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReviewSubmission;
