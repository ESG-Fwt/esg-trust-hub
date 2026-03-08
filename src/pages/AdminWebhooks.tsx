import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Webhook, Plus, Copy, Loader2, Activity, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';

const AdminWebhooks = () => {
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [selectedLogs, setSelectedLogs] = useState<string | null>(null);

  const loadData = async () => {
    const [{ data: ep }, { data: lg }] = await Promise.all([
      supabase.from('webhook_endpoints').select('*').order('created_at', { ascending: false }),
      supabase.from('webhook_logs').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    setEndpoints(ep ?? []);
    setLogs(lg ?? []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const createEndpoint = async () => {
    if (!user || !newUrl) return;
    setCreating(true);
    const { error } = await supabase.from('webhook_endpoints').insert({
      created_by: user.id,
      url: newUrl,
      label: newLabel || 'ERP Webhook',
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t('webhooks.created'));
    setDialogOpen(false);
    setNewUrl('');
    setNewLabel('');
    loadData();
  };

  const toggleEndpoint = async (id: string, active: boolean) => {
    await supabase.from('webhook_endpoints').update({ is_active: active }).eq('id', id);
    loadData();
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success(t('webhooks.secretCopied'));
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('webhooks.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('webhooks.subtitle')}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> {t('webhooks.newEndpoint')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('webhooks.newEndpoint')}</DialogTitle>
                <DialogDescription>{t('webhooks.newEndpointDesc')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t('webhooks.label')}</Label>
                  <Input placeholder="e.g. SAP Ariba Production" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('webhooks.url')}</Label>
                  <Input placeholder="https://erp.example.com/webhooks/esg" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                </div>
                <Button onClick={createEndpoint} disabled={creating || !newUrl} className="w-full">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Webhook className="w-4 h-4 mr-2" />}
                  {t('webhooks.create')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Webhook className="w-5 h-5" /> {t('webhooks.endpoints')}</CardTitle>
          </CardHeader>
          <CardContent>
            {endpoints.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t('webhooks.noEndpoints')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('webhooks.label')}</TableHead>
                    <TableHead>{t('webhooks.url')}</TableHead>
                    <TableHead>{t('webhooks.events')}</TableHead>
                    <TableHead>{t('webhooks.lastStatus')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints.map(ep => (
                    <TableRow key={ep.id}>
                      <TableCell className="font-medium">{ep.label}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{ep.url}</TableCell>
                      <TableCell><Badge variant="outline">{(ep.events ?? []).join(', ')}</Badge></TableCell>
                      <TableCell>
                        {ep.last_status_code ? (
                          <Badge variant={ep.last_status_code < 300 ? 'default' : 'destructive'}>{ep.last_status_code}</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Switch checked={ep.is_active} onCheckedChange={v => toggleEndpoint(ep.id, v)} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copySecret(ep.secret)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" /> {t('webhooks.recentDeliveries')}</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t('webhooks.noLogs')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('webhooks.event')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell><Badge variant="outline">{log.event}</Badge></TableCell>
                      <TableCell>
                        {log.status_code && log.status_code < 300
                          ? <CheckCircle2 className="w-4 h-4 text-primary" />
                          : <XCircle className="w-4 h-4 text-destructive" />}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'dd MMM yyyy HH:mm')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminWebhooks;
