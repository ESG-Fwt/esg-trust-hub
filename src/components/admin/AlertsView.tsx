import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Bell, BellOff, Plus, Calendar, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';

const AlertsView = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDeadline, setNewDeadline] = useState({ orgId: '', periodLabel: '', dueDate: '' });

  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data } = await supabase.from('organizations').select('*').order('name');
      return data ?? [];
    },
  });

  const { data: deadlines, isLoading: deadlinesLoading } = useQuery({
    queryKey: ['submission-deadlines'],
    queryFn: async () => {
      const { data } = await supabase.from('submission_deadlines').select('*').order('due_date', { ascending: true });
      return data ?? [];
    },
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['compliance-alerts'],
    queryFn: async () => {
      const { data } = await supabase.from('compliance_alerts').select('*').order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const createDeadline = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('submission_deadlines').insert({
        organization_id: newDeadline.orgId,
        period_label: newDeadline.periodLabel,
        due_date: newDeadline.dueDate,
        created_by: user?.id ?? '',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission-deadlines'] });
      setDialogOpen(false);
      setNewDeadline({ orgId: '', periodLabel: '', dueDate: '' });
      toast({ title: t('alerts.deadlineCreated') });
    },
    onError: () => {
      toast({ title: t('alerts.errorCreating'), variant: 'destructive' });
    },
  });

  const markAlertRead = useMutation({
    mutationFn: async (alertId: string) => {
      await supabase.from('compliance_alerts').update({ is_read: true }).eq('id', alertId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['compliance-alerts'] }),
  });

  const orgMap = new Map((organizations ?? []).map((o) => [o.id, o.name]));
  const unreadCount = alerts?.filter((a) => !a.is_read).length ?? 0;
  const now = new Date();
  const overdueDeadlines = deadlines?.filter((d) => new Date(d.due_date) < now) ?? [];

  const isLoading = deadlinesLoading || alertsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('alerts.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('alerts.subtitle')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('alerts.newDeadline')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('alerts.setDeadline')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>{t('users.organization')}</Label>
                <Select value={newDeadline.orgId} onValueChange={(v) => setNewDeadline((p) => ({ ...p, orgId: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('users.selectOrg')} /></SelectTrigger>
                  <SelectContent>
                    {organizations?.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('alerts.periodLabel')}</Label>
                <Input
                  placeholder="e.g. Q1 2025"
                  value={newDeadline.periodLabel}
                  onChange={(e) => setNewDeadline((p) => ({ ...p, periodLabel: e.target.value }))}
                />
              </div>
              <div>
                <Label>{t('alerts.dueDate')}</Label>
                <Input
                  type="date"
                  value={newDeadline.dueDate}
                  onChange={(e) => setNewDeadline((p) => ({ ...p, dueDate: e.target.value }))}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createDeadline.mutate()}
                disabled={!newDeadline.orgId || !newDeadline.periodLabel || !newDeadline.dueDate || createDeadline.isPending}
              >
                {createDeadline.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {t('common.create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[40vh] gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="enterprise-card">
                <CardContent className="pt-5 pb-4">
                  <div className="w-10 h-10 rounded-lg bg-status-pending-bg flex items-center justify-center mb-2">
                    <Calendar className="w-5 h-5 text-status-pending" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{deadlines?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{t('alerts.activeDeadlines')}</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <Card className="enterprise-card">
                <CardContent className="pt-5 pb-4">
                  <div className="w-10 h-10 rounded-lg bg-status-rejected-bg flex items-center justify-center mb-2">
                    <AlertTriangle className="w-5 h-5 text-status-rejected" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{overdueDeadlines.length}</p>
                  <p className="text-xs text-muted-foreground">{t('alerts.overdueDeadlines')}</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
              <Card className="enterprise-card">
                <CardContent className="pt-5 pb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-2">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{unreadCount}</p>
                  <p className="text-xs text-muted-foreground">{t('alerts.unreadAlerts')}</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Deadlines */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('alerts.submissionDeadlines')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!deadlines || deadlines.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  {t('alerts.noDeadlines')}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {deadlines.map((d, i) => {
                    const isOverdue = new Date(d.due_date) < now;
                    return (
                      <motion.div
                        key={d.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-4 px-6 py-3"
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isOverdue ? 'bg-status-rejected' : 'bg-status-approved'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{d.period_label}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {orgMap.get(d.organization_id) ?? 'Unknown'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-foreground">{new Date(d.due_date).toLocaleDateString()}</p>
                          {isOverdue ? (
                            <Badge variant="destructive" className="text-[10px]">{t('alerts.overdue')}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-status-approved">{t('alerts.onTrack')}</Badge>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('alerts.complianceAlerts')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!alerts || alerts.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                  <BellOff className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  {t('alerts.noAlerts')}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {alerts.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex items-center gap-4 px-6 py-3 ${!a.is_read ? 'bg-accent/30' : ''}`}
                    >
                      <AlertTriangle className={`w-4 h-4 shrink-0 ${!a.is_read ? 'text-status-rejected' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{a.message}</p>
                        <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                      </div>
                      {!a.is_read && (
                        <Button variant="ghost" size="sm" onClick={() => markAlertRead.mutate(a.id)}>
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AlertsView;
