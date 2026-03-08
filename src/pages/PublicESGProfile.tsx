import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import logoImg from '@/assets/esg-chain-logo.png';
import { Loader2, Building2, Users, Shield, Leaf, CheckCircle2, XCircle } from 'lucide-react';

const PublicESGProfile = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      // Fetch token info (public RPC would be better but we use anon for now)
      const { data: tkData, error: tkErr } = await supabase
        .from('esg_share_tokens')
        .select('*, profiles:user_id(full_name, organization_id, organizations:organization_id(name))')
        .eq('token', token)
        .eq('is_active', true)
        .maybeSingle();

      if (tkErr || !tkData) {
        setError('This link is invalid or has been revoked.');
        setLoading(false);
        return;
      }

      // Check expiry
      if (tkData.expires_at && new Date(tkData.expires_at) < new Date()) {
        setError('This link has expired.');
        setLoading(false);
        return;
      }

      // Increment view count
      await supabase.from('esg_share_tokens').update({ view_count: (tkData.view_count ?? 0) + 1 }).eq('id', tkData.id);

      // Fetch questionnaire
      const { data: qData } = await supabase
        .from('vsme_questionnaires')
        .select('*')
        .eq('user_id', tkData.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fetch latest approved submissions
      const { data: subs } = await supabase
        .from('submissions')
        .select('electricity, gas, fuel, waste, water, total_emissions, period_start, period_end, status')
        .eq('user_id', tkData.user_id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(5);

      setData({ token: tkData, questionnaire: qData, submissions: subs ?? [] });
      setLoading(false);
    };
    load();
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-md w-full"><CardContent className="py-12 text-center">
        <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground">{error}</p>
      </CardContent></Card>
    </div>
  );

  const profile = (data.token as any).profiles;
  const orgName = profile?.organizations?.name ?? 'Independent';
  const q = data.questionnaire;

  const BoolRow = ({ label, value }: { label: string; value: boolean }) => (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {value ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <XCircle className="w-4 h-4 text-muted-foreground/40" />}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <img src={logoImg} alt="ESG Chain" className="w-9 h-9 rounded-lg" />
          <div>
            <span className="text-sm font-semibold text-foreground">ESG Chain</span>
            <p className="text-xs text-muted-foreground">Verified ESG Data Passport</p>
          </div>
          <Badge variant="outline" className="ml-auto">Public View</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{profile?.full_name}</h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Building2 className="w-4 h-4" /> <span className="text-sm">{orgName}</span>
          </div>
        </div>

        {/* Environmental */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Leaf className="w-5 h-5 text-primary" /> Environmental (E)</CardTitle>
            <CardDescription>Latest approved emission data</CardDescription>
          </CardHeader>
          <CardContent>
            {data.submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No verified emission data yet.</p>
            ) : (
              <div className="space-y-2">
                {data.submissions.map((s: any, i: number) => (
                  <div key={i} className="grid grid-cols-6 gap-2 text-sm py-2 border-b border-border last:border-0">
                    <span className="text-muted-foreground col-span-2">{s.period_start ?? '—'}</span>
                    <span>{s.electricity} kWh</span>
                    <span>{s.gas} m³</span>
                    <span>{s.fuel} L</span>
                    <span className="font-medium text-primary">{s.total_emissions} kg CO₂e</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social */}
        {q && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Social (S)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-2xl font-bold text-foreground">{q.total_employees}</p><p className="text-xs text-muted-foreground">Employees</p></div>
                <div><p className="text-2xl font-bold text-foreground">{q.female_employees}</p><p className="text-xs text-muted-foreground">Female</p></div>
                <div><p className="text-2xl font-bold text-foreground">{q.health_safety_incidents}</p><p className="text-xs text-muted-foreground">H&S Incidents</p></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Governance */}
        {q && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Governance (G)</CardTitle>
            </CardHeader>
            <CardContent>
              <BoolRow label="Code of Conduct" value={q.has_code_of_conduct} />
              <BoolRow label="Anti-Corruption Policy" value={q.has_anti_corruption_policy} />
              <BoolRow label="Whistleblower Channel" value={q.has_whistleblower_channel} />
              <BoolRow label="Sustainability Officer" value={q.has_sustainability_officer} />
              <BoolRow label="Board ESG Oversight" value={q.board_esg_oversight} />
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="border-t border-border py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          Verified by ESG Chain · Data Passport · {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default PublicESGProfile;
