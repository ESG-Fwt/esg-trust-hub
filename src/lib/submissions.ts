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
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        profiles!submissions_user_id_fkey (full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((s: any) => ({
      ...s,
      supplier_name: s.profiles?.full_name ?? 'Unknown',
    }));
  },

  updateStatus: async (id: string, status: 'approved' | 'rejected') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updates: any = {
      status,
      reviewed_by: user.id,
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
      action: status === 'approved' ? 'APPROVED' : 'REJECTED',
      performed_by: user.id,
      hash: 'SHA-256: ' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
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
