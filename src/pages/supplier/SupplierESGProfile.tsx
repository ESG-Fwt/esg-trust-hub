import { useState, useEffect } from 'react';
import { SupplierLayout } from '@/components/supplier/SupplierLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Users, Shield, Save, Loader2 } from 'lucide-react';

const SupplierESGProfile = () => {
  const { user, profile } = useAuthStore();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<any>(null);

  const [form, setForm] = useState({
    total_employees: 0,
    female_employees: 0,
    male_employees: 0,
    gender_pay_gap_percent: '',
    employee_turnover_percent: '',
    health_safety_incidents: 0,
    has_code_of_conduct: false,
    has_anti_corruption_policy: false,
    has_whistleblower_channel: false,
    has_sustainability_officer: false,
    board_esg_oversight: false,
    governance_notes: '',
    reporting_year: new Date().getFullYear(),
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('vsme_questionnaires')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setQuestionnaire(data);
        setForm({
          total_employees: data.total_employees ?? 0,
          female_employees: data.female_employees ?? 0,
          male_employees: data.male_employees ?? 0,
          gender_pay_gap_percent: data.gender_pay_gap_percent?.toString() ?? '',
          employee_turnover_percent: data.employee_turnover_percent?.toString() ?? '',
          health_safety_incidents: data.health_safety_incidents ?? 0,
          has_code_of_conduct: data.has_code_of_conduct ?? false,
          has_anti_corruption_policy: data.has_anti_corruption_policy ?? false,
          has_whistleblower_channel: data.has_whistleblower_channel ?? false,
          has_sustainability_officer: data.has_sustainability_officer ?? false,
          board_esg_oversight: data.board_esg_oversight ?? false,
          governance_notes: data.governance_notes ?? '',
          reporting_year: data.reporting_year ?? new Date().getFullYear(),
        });
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      organization_id: profile?.organization_id ?? null,
      total_employees: form.total_employees,
      female_employees: form.female_employees,
      male_employees: form.male_employees,
      gender_pay_gap_percent: form.gender_pay_gap_percent ? parseFloat(form.gender_pay_gap_percent) : null,
      employee_turnover_percent: form.employee_turnover_percent ? parseFloat(form.employee_turnover_percent) : null,
      health_safety_incidents: form.health_safety_incidents,
      has_code_of_conduct: form.has_code_of_conduct,
      has_anti_corruption_policy: form.has_anti_corruption_policy,
      has_whistleblower_channel: form.has_whistleblower_channel,
      has_sustainability_officer: form.has_sustainability_officer,
      board_esg_oversight: form.board_esg_oversight,
      governance_notes: form.governance_notes,
      reporting_year: form.reporting_year,
      status: 'submitted',
    };

    let error;
    if (questionnaire) {
      ({ error } = await supabase.from('vsme_questionnaires').update(payload).eq('id', questionnaire.id));
    } else {
      ({ error } = await supabase.from('vsme_questionnaires').insert(payload));
    }

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('vsme.saved'));
    }
  };

  if (loading) return <SupplierLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></SupplierLayout>;

  return (
    <SupplierLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('vsme.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('vsme.subtitle')}</p>
        </div>

        {/* Social (S) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> {t('vsme.socialTitle')}</CardTitle>
            <CardDescription>{t('vsme.socialDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>{t('vsme.totalEmployees')}</Label>
                <Input type="number" min={0} value={form.total_employees} onChange={e => setForm(f => ({ ...f, total_employees: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('vsme.femaleEmployees')}</Label>
                <Input type="number" min={0} value={form.female_employees} onChange={e => setForm(f => ({ ...f, female_employees: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('vsme.maleEmployees')}</Label>
                <Input type="number" min={0} value={form.male_employees} onChange={e => setForm(f => ({ ...f, male_employees: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>{t('vsme.genderPayGap')}</Label>
                <Input type="number" step="0.1" placeholder="%" value={form.gender_pay_gap_percent} onChange={e => setForm(f => ({ ...f, gender_pay_gap_percent: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('vsme.turnover')}</Label>
                <Input type="number" step="0.1" placeholder="%" value={form.employee_turnover_percent} onChange={e => setForm(f => ({ ...f, employee_turnover_percent: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('vsme.hsSIncidents')}</Label>
                <Input type="number" min={0} value={form.health_safety_incidents} onChange={e => setForm(f => ({ ...f, health_safety_incidents: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Governance (G) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> {t('vsme.govTitle')}</CardTitle>
            <CardDescription>{t('vsme.govDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'has_code_of_conduct', label: t('vsme.codeOfConduct') },
              { key: 'has_anti_corruption_policy', label: t('vsme.antiCorruption') },
              { key: 'has_whistleblower_channel', label: t('vsme.whistleblower') },
              { key: 'has_sustainability_officer', label: t('vsme.sustainabilityOfficer') },
              { key: 'board_esg_oversight', label: t('vsme.boardOversight') },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <Label className="cursor-pointer">{item.label}</Label>
                <Switch
                  checked={(form as any)[item.key]}
                  onCheckedChange={v => setForm(f => ({ ...f, [item.key]: v }))}
                />
              </div>
            ))}
            <Separator />
            <div className="space-y-1.5">
              <Label>{t('vsme.govNotes')}</Label>
              <Textarea rows={3} placeholder={t('vsme.govNotesPlaceholder')} value={form.governance_notes} onChange={e => setForm(f => ({ ...f, governance_notes: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label>{t('vsme.reportingYear')}</Label>
            <Input type="number" className="w-24" value={form.reporting_year} onChange={e => setForm(f => ({ ...f, reporting_year: parseInt(e.target.value) || 2025 }))} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </div>
    </SupplierLayout>
  );
};

export default SupplierESGProfile;
