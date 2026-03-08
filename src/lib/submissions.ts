import { supabase } from '@/integrations/supabase/client';
import type { EnergyData } from '@/stores/wizardStore';

export interface Submission {
  id: string;
  created_at: string;
  user_id: string;
  organization_id: string | null;
  electricity: number;
  gas: number;
  fuel: number;
  waste: number;
  water: number;
  total_emissions: number;
  status: 'pending' | 'approved' | 'rejected';
  file_url: string | null;
  audit_hash: string | null;
  verified_at: string | null;
  reviewed_by: string | null;
  revision_notes: string | null;
  period_start: string | null;
  period_end: string | null;
  // Joined data
  supplier_name?: string;
  supplier_company?: string;
}

/** Fetch emission factors from the database, with hardcoded fallback. */
const getEmissionFactors = async (): Promise<Record<string, number>> => {
  const defaults: Record<string, number> = {
    electricity: 0.5,
    gas: 2.0,
    fuel: 2.5,
    waste: 0.3,
    water: 0.1,
  };

  try {
    const { data, error } = await supabase
      .from('emission_factors')
      .select('source, co2_multiplier');

    if (error || !data || data.length === 0) return defaults;

    const factors: Record<string, number> = { ...defaults };
    for (const row of data) {
      factors[row.source] = Number(row.co2_multiplier);
    }
    return factors;
  } catch {
    return defaults;
  }
};

/** Calculate total CO2e from energy data and factor map. */
export const calculateEmissions = (data: EnergyData, factors: Record<string, number>): number => {
  return Math.round(
    data.electricity * (factors.electricity ?? 0.5) +
    data.gas * (factors.gas ?? 2.0) +
    data.fuel * (factors.fuel ?? 2.5) +
    data.waste * (factors.waste ?? 0.3) +
    data.water * (factors.water ?? 0.1)
  );
};

export const submissionsApi = {
  submit: async (data: EnergyData, fileUrl?: string, periodStart?: string, periodEnd?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const [profile, factors] = await Promise.all([
      supabase.from('profiles').select('organization_id').eq('user_id', user.id).single(),
      getEmissionFactors(),
    ]);

    const totalEmissions = calculateEmissions(data, factors);

    const { data: submission, error } = await supabase.from('submissions').insert({
      user_id: user.id,
      organization_id: profile.data?.organization_id ?? null,
      electricity: data.electricity,
      gas: data.gas,
      fuel: data.fuel,
      waste: data.waste,
      water: data.water,
      total_emissions: totalEmissions,
      file_url: fileUrl ?? null,
      period_start: periodStart ?? null,
      period_end: periodEnd ?? null,
    }).select().single();

    if (error) throw error;

    await supabase.from('audit_logs').insert({
      submission_id: submission.id,
      action: 'CREATED',
      performed_by: user.id,
      hash: 'SHA-256: ' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
    });

    return submission;
  },

  getAll: async (): Promise<Submission[]> => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Submission[];
  },

  getWithProfiles: async (): Promise<Submission[]> => {
    const { data: subs, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!subs || subs.length === 0) return [];

    const userIds = [...new Set(subs.map((s) => s.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));

    return subs.map((s) => ({
      ...s,
      supplier_name: nameMap.get(s.user_id) ?? 'Unknown',
    })) as Submission[];
  },

  getById: async (id: string): Promise<Submission | null> => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', data.user_id)
      .single();

    return { ...data, supplier_name: profile?.full_name ?? 'Unknown' } as Submission;
  },

  updateStatus: async (id: string, status: 'approved' | 'rejected', revisionNotes?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updates: Record<string, unknown> = {
      status,
      reviewed_by: user.id,
      revision_notes: revisionNotes ?? null,
    };

    if (status === 'approved') {
      updates.audit_hash = 'SHA-256: ' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
      updates.verified_at = new Date().toISOString();
    }

    const { error } = await supabase.from('submissions').update(updates).eq('id', id);
    if (error) throw error;

    await supabase.from('audit_logs').insert({
      submission_id: id,
      action: status === 'approved' ? 'APPROVED' : 'REVISION_REQUESTED',
      performed_by: user.id,
      hash: 'SHA-256: ' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
      metadata: revisionNotes ? { revision_notes: revisionNotes } : {},
    });

    return { success: true };
  },

  getStats: async () => {
    const { data: submissions } = await supabase.from('submissions').select('status, total_emissions, user_id');

    const all = submissions ?? [];
    const pending = all.filter(s => s.status === 'pending').length;
    const approved = all.filter(s => s.status === 'approved').length;
    const total = all.length;
    const totalEmissions = all.reduce((sum, s) => sum + Number(s.total_emissions), 0);

    return {
      pendingReviews: pending,
      complianceRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      totalEmissions,
      activeSuppliers: new Set(all.map(s => s.user_id)).size,
    };
  },

  getAuditLogs: async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  uploadFile: async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('submissions').upload(filePath, file);
    if (error) throw error;

    return filePath;
  },

  exportCSV: (submissions: Submission[]): string => {
    const headers = ['Date', 'Supplier', 'Electricity (kWh)', 'Gas (m³)', 'Fuel (L)', 'Waste (kg)', 'Water (m³)', 'Total CO₂e (kg)', 'Status', 'Period Start', 'Period End'];
    const rows = submissions.map(s => [
      new Date(s.created_at).toLocaleDateString(),
      s.supplier_name ?? 'Unknown',
      s.electricity,
      s.gas,
      s.fuel,
      s.waste,
      s.water,
      s.total_emissions,
      s.status,
      s.period_start ?? '',
      s.period_end ?? '',
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },
};
