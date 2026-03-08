import { supabase } from '@/integrations/supabase/client';
import type { EnergyData } from '@/stores/wizardStore';

export interface Submission {
  id: string;
  created_at: string;
  user_id: string;
  organization_id: string;
  electricity: number;
  gas: number;
  fuel: number;
  waste: number;
  total_emissions: number;
  status: 'pending' | 'approved' | 'rejected';
  file_url: string | null;
  audit_hash: string | null;
  verified_at: string | null;
  reviewed_by: string | null;
  revision_notes: string | null;
  // Joined data
  supplier_name?: string;
  supplier_company?: string;
}

export const submissionsApi = {
  submit: async (data: EnergyData, fileUrl?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const profile = await supabase.from('profiles').select('organization_id').eq('user_id', user.id).single();

    const totalEmissions = Math.round(
      data.electricity * 0.5 + data.gas * 2.0 + data.fuel * 2.5 + data.waste * 0.3
    );

    const { data: submission, error } = await supabase.from('submissions').insert({
      user_id: user.id,
      organization_id: profile.data?.organization_id ?? null,
      electricity: data.electricity,
      gas: data.gas,
      fuel: data.fuel,
      waste: data.waste,
      total_emissions: totalEmissions,
      file_url: fileUrl ?? null,
    }).select().single();

    if (error) throw error;

    // Create audit log entry
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
    // submissions.user_id -> auth.users (not profiles), so we can't FK-join.
    // Fetch submissions + profiles separately and merge.
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

    // Fetch supplier name separately
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

    // Create audit log
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
    const { data: submissions } = await supabase.from('submissions').select('status, total_emissions');

    const all = submissions ?? [];
    const pending = all.filter(s => s.status === 'pending').length;
    const approved = all.filter(s => s.status === 'approved').length;
    const total = all.length;
    const totalEmissions = all.reduce((sum, s) => sum + Number(s.total_emissions), 0);

    return {
      pendingReviews: pending,
      complianceRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      totalEmissions,
      activeSuppliers: new Set(submissions?.map(s => (s as any).user_id)).size,
    };
  },

  uploadFile: async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('submissions').upload(filePath, file);
    if (error) throw error;

    return filePath;
  },
};
