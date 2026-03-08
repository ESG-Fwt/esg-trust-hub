import { useState, useEffect } from 'react';
import { SupplierLayout } from '@/components/supplier/SupplierLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Share2, Link2, Plus, Copy, Trash2, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const SupplierShareProfile = () => {
  const { user, profile } = useAuthStore();
  const { t } = useLanguage();
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  const loadTokens = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('esg_share_tokens')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTokens(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadTokens(); }, [user]);

  const createToken = async () => {
    if (!user) return;
    setCreating(true);
    const { error } = await supabase.from('esg_share_tokens').insert({
      user_id: user.id,
      organization_id: profile?.organization_id ?? null,
      label: newLabel || 'Shared Profile',
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t('passport.created'));
    setNewLabel('');
    loadTokens();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/esg-profile/${token}`;
    navigator.clipboard.writeText(url);
    toast.success(t('passport.copied'));
  };

  const revokeToken = async (id: string) => {
    await supabase.from('esg_share_tokens').update({ is_active: false }).eq('id', id);
    toast.success(t('passport.revoked'));
    loadTokens();
  };

  if (loading) return <SupplierLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></SupplierLayout>;

  return (
    <SupplierLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('passport.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('passport.subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" /> {t('passport.newLink')}</CardTitle>
            <CardDescription>{t('passport.newLinkDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input placeholder={t('passport.labelPlaceholder')} value={newLabel} onChange={e => setNewLabel(e.target.value)} className="flex-1" />
              <Button onClick={createToken} disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
                {t('passport.generate')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Link2 className="w-5 h-5" /> {t('passport.activeLinks')}</CardTitle>
          </CardHeader>
          <CardContent>
            {tokens.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t('passport.noLinks')}</p>
            ) : (
              <div className="space-y-3">
                {tokens.map(tk => (
                  <div key={tk.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{tk.label}</p>
                        <Badge variant={tk.is_active ? 'default' : 'secondary'}>{tk.is_active ? t('passport.active') : t('passport.revoked')}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {tk.view_count} {t('passport.views')}</span>
                        <span>{format(new Date(tk.created_at), 'dd MMM yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      {tk.is_active && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyLink(tk.token)}><Copy className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => revokeToken(tk.id)}><Trash2 className="w-4 h-4" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SupplierLayout>
  );
};

export default SupplierShareProfile;
