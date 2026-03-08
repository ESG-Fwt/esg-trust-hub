import { useEffect, useState } from 'react';
import { SupplierLayout } from '@/components/supplier/SupplierLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, TrendingUp, Clock, CheckCircle2, XCircle, MessageSquare, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Submission {
  id: string;
  electricity: number;
  gas: number;
  fuel: number;
  waste: number;
  water: number;
  total_emissions: number;
  status: string;
  created_at: string;
  revision_notes: string | null;
  period_start: string | null;
  period_end: string | null;
}

const SupplierHistory = () => {
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const statusConfig: Record<string, { labelKey: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
    pending: { labelKey: 'history.statusPending', variant: 'outline', icon: Clock },
    approved: { labelKey: 'history.statusApproved', variant: 'default', icon: CheckCircle2 },
    rejected: { labelKey: 'history.statusRejected', variant: 'destructive', icon: XCircle },
  };

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await supabase
        .from('submissions')
        .select('id, electricity, gas, fuel, waste, water, total_emissions, status, created_at, revision_notes, period_start, period_end')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setSubmissions(data ?? []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const rejectedWithNotes = submissions.filter(s => s.status === 'rejected' && s.revision_notes);
  const totalEmissions = submissions.reduce((s, sub) => s + Number(sub.total_emissions), 0);
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  return (
    <SupplierLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('history.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('history.subtitle')}</p>
        </div>

        {/* Prominent Notification Banner for Rejected Submissions */}
        <AnimatePresence>
          {rejectedWithNotes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-lg border-2 border-destructive/30 bg-destructive/5 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-destructive">
                    {t('history.actionRequired')} — {rejectedWithNotes.length} {rejectedWithNotes.length === 1 ? t('history.submissionNeedsRevision') : t('history.submissionsNeedRevision')}
                  </h3>
                  <div className="mt-2 space-y-2">
                    {rejectedWithNotes.slice(0, 3).map((sub) => (
                      <div key={sub.id} className="flex items-start gap-2 text-sm">
                        <MessageSquare className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs text-muted-foreground">{format(new Date(sub.created_at), 'MMM d, yyyy')} — </span>
                          <span className="text-foreground">{sub.revision_notes}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{submissions.length}</p>
                <p className="text-xs text-muted-foreground">{t('history.totalSubmissions')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalEmissions.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">{t('history.totalCO2e')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-status-pending-bg flex items-center justify-center">
                <Clock className="w-5 h-5 text-status-pending" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">{t('history.awaitingReview')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('history.submissionHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>{t('history.noSubmissions')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.date')}</TableHead>
                      <TableHead>{t('energy.period')}</TableHead>
                      <TableHead className="text-right">{t('energy.electricity')}</TableHead>
                      <TableHead className="text-right">{t('energy.naturalGas')}</TableHead>
                      <TableHead className="text-right">{t('energy.fuel')}</TableHead>
                      <TableHead className="text-right">{t('energy.waste')}</TableHead>
                      <TableHead className="text-right">{t('energy.water')}</TableHead>
                      <TableHead className="text-right">Total CO₂e</TableHead>
                      <TableHead>{t('common.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub) => {
                      const cfg = statusConfig[sub.status] ?? statusConfig.pending;
                      const Icon = cfg.icon;
                      return (
                        <React.Fragment key={sub.id}>
                          <TableRow>
                            <TableCell className="font-medium">{format(new Date(sub.created_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {sub.period_start && sub.period_end
                                ? `${sub.period_start} → ${sub.period_end}`
                                : '—'}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">{Number(sub.electricity).toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{Number(sub.gas).toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{Number(sub.fuel).toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{Number(sub.waste).toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{Number(sub.water).toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold">{Number(sub.total_emissions).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={cfg.variant} className="gap-1">
                                <Icon className="w-3 h-3" />
                                {t(cfg.labelKey)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                          {sub.status === 'rejected' && sub.revision_notes && (
                            <TableRow key={`${sub.id}-notes`}>
                              <TableCell colSpan={9} className="bg-destructive/5 border-l-2 border-destructive/30">
                                <div className="flex items-start gap-2 py-1">
                                  <MessageSquare className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-xs font-medium text-destructive">{t('history.revisionFeedback')}</p>
                                    <p className="text-sm text-foreground mt-0.5">{sub.revision_notes}</p>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SupplierLayout>
  );
};

import React from 'react';
export default SupplierHistory;
