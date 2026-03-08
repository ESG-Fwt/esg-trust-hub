import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi, Submission } from '@/lib/submissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Download, Shield, CheckCircle, XCircle, Clock, Zap, Flame, Droplets, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const AdminReviewSubmission = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const { data: submissions } = useQuery({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const handleApprove = async () => {
    if (!submission) return;
    await updateMutation.mutateAsync({ id: submission.id, status: 'approved' });
    toast.success('Submission approved!');
  };

  const handleReject = async () => {
    if (!submission) return;
    await updateMutation.mutateAsync({ id: submission.id, status: 'rejected' });
    toast.error('Submission rejected.');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-status-pending-bg text-status-pending border-status-pending/30">Pending Review</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-status-approved-bg text-status-approved border-status-approved/30">Approved</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-status-rejected-bg text-status-rejected border-status-rejected/30">Rejected</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!submission) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading submission...
        </div>
      </AdminLayout>
    );
  }

  const energyItems = [
    { label: 'Electricity', value: Number(submission.electricity), unit: 'kWh', icon: Zap, color: 'text-yellow-500' },
    { label: 'Natural Gas', value: Number(submission.gas), unit: 'm³', icon: Flame, color: 'text-orange-500' },
    { label: 'Fuel', value: Number(submission.fuel), unit: 'L', icon: Droplets, color: 'text-blue-500' },
    { label: 'Waste', value: Number(submission.waste), unit: 'kg', icon: Trash2, color: 'text-muted-foreground' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{submission.supplier_name ?? 'Unknown Supplier'}</h1>
              {getStatusBadge(submission.status)}
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Submitted {new Date(submission.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {submission.status === 'pending' && (
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={handleReject} disabled={updateMutation.isPending}>
                <XCircle className="w-4 h-4 mr-1" /> Reject
              </Button>
              <Button size="sm" onClick={handleApprove} disabled={updateMutation.isPending}>
                <CheckCircle className="w-4 h-4 mr-1" /> Approve
              </Button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Energy Data — left 3 cols */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Energy Consumption Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {energyItems.map((item, i) => (
                  <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 bg-muted/40 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="text-sm text-foreground">{item.label}</span>
                    </div>
                    <span className="font-mono text-sm font-medium">{item.value.toLocaleString()} {item.unit}</span>
                  </motion.div>
                ))}
                <Separator />
                <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <span className="text-sm font-medium text-foreground">Total CO₂e</span>
                  <span className="font-mono text-lg font-bold text-primary">{Number(submission.total_emissions).toLocaleString()} kg</span>
                </div>
              </CardContent>
            </Card>

            {/* Audit Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Audit Trail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{new Date(submission.created_at).toLocaleString()}</span>
                </div>
                {submission.verified_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified</span>
                    <span className="font-medium">{new Date(submission.verified_at).toLocaleString()}</span>
                  </div>
                )}
                {submission.audit_hash && (
                  <div className="mt-3 p-3 bg-status-approved-bg rounded-lg border border-status-approved/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-3.5 h-3.5 text-status-approved" />
                      <span className="text-xs font-medium text-status-approved">Verified Audit Hash</span>
                    </div>
                    <code className="text-[10px] font-mono text-muted-foreground break-all block">{submission.audit_hash}</code>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* File Preview — right 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Source Document</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[3/4] bg-muted rounded-lg border border-border overflow-hidden">
                  {filePreviewUrl ? (
                    submission.file_url?.endsWith('.pdf') ? (
                      <iframe src={filePreviewUrl} className="w-full h-full" title="Document preview" />
                    ) : (
                      <img src={filePreviewUrl} alt="Document" className="w-full h-full object-contain" />
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="w-12 h-12 mb-2 opacity-40" />
                      <p className="text-sm">No file uploaded</p>
                    </div>
                  )}
                </div>
                {filePreviewUrl && (
                  <a href={filePreviewUrl} target="_blank" rel="noopener noreferrer" className="block mt-3">
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="w-3.5 h-3.5 mr-2" /> Download Original
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReviewSubmission;
