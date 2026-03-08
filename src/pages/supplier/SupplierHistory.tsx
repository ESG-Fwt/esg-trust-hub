import { useEffect, useState } from 'react';
import { SupplierLayout } from '@/components/supplier/SupplierLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Submission {
  id: string;
  electricity: number;
  gas: number;
  fuel: number;
  waste: number;
  total_emissions: number;
  status: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending: { label: 'Pending', variant: 'outline', icon: Clock },
  approved: { label: 'Approved', variant: 'default', icon: CheckCircle2 },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
};

const SupplierHistory = () => {
  const { user } = useAuthStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('submissions')
        .select('id, electricity, gas, fuel, waste, total_emissions, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setSubmissions(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const totalEmissions = submissions.reduce((s, sub) => s + Number(sub.total_emissions), 0);
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  return (
    <SupplierLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Submissions</h1>
          <p className="text-sm text-muted-foreground mt-1">Track the status of all your energy data submissions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{submissions.length}</p>
                <p className="text-xs text-muted-foreground">Total Submissions</p>
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
                <p className="text-xs text-muted-foreground">Total CO₂e (tonnes)</p>
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
                <p className="text-xs text-muted-foreground">Awaiting Review</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submission History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No submissions yet. Start by creating a new submission.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Electricity</TableHead>
                      <TableHead className="text-right">Gas</TableHead>
                      <TableHead className="text-right">Fuel</TableHead>
                      <TableHead className="text-right">Waste</TableHead>
                      <TableHead className="text-right">Total CO₂e</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub) => {
                      const cfg = statusConfig[sub.status] ?? statusConfig.pending;
                      const Icon = cfg.icon;
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{format(new Date(sub.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{Number(sub.electricity).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{Number(sub.gas).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{Number(sub.fuel).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{Number(sub.waste).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold">{Number(sub.total_emissions).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={cfg.variant} className="gap-1">
                              <Icon className="w-3 h-3" />
                              {cfg.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
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

export default SupplierHistory;
