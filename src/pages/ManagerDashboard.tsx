import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Leaf, Clock, TrendingUp, Users, Factory, Eye,
  CheckCircle, XCircle, FileText, Shield, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { submissionsApi, Submission } from '@/lib/submissions';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, logout } = useAuthStore();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: submissionsApi.getStats,
    refetchInterval: 30000,
  });

  const { data: submissions } = useQuery({
    queryKey: ['submissions'],
    queryFn: submissionsApi.getWithProfiles,
    refetchInterval: 10000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      submissionsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const handleViewDetails = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    await updateStatusMutation.mutateAsync({ id: selectedSubmission.id, status: 'approved' });
    toast.success('Submission approved! Audit hash generated.');
    setIsModalOpen(false);
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    await updateStatusMutation.mutateAsync({ id: selectedSubmission.id, status: 'rejected' });
    toast.error('Submission rejected.');
    setIsModalOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const statCards = [
    { title: 'Pending Reviews', value: stats?.pendingReviews ?? 0, icon: Clock, color: 'text-status-pending', bgColor: 'bg-status-pending-bg' },
    { title: 'Compliance Rate', value: `${stats?.complianceRate ?? 0}%`, icon: TrendingUp, color: 'text-primary', bgColor: 'bg-accent' },
    { title: 'Total Emissions', value: `${((stats?.totalEmissions ?? 0) / 1000).toFixed(1)}t`, icon: Factory, color: 'text-slate-600', bgColor: 'bg-slate-100' },
    { title: 'Active Suppliers', value: stats?.activeSuppliers ?? 0, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-status-pending-bg text-status-pending border-status-pending/30">Pending</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-status-approved-bg text-status-approved border-status-approved/30">Approved</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-status-rejected-bg text-status-rejected border-status-rejected/30">Rejected</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-semibold text-foreground">ESG Chain</span>
              <p className="text-xs text-muted-foreground">Manager Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">Manager</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Analytics Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="enterprise-card">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                        <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Submissions</h2>
            <Badge variant="secondary" className="font-normal">Auto-refreshing</Badge>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Emissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions?.map((submission, index) => (
                    <motion.tr key={submission.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="group hover:bg-muted/50">
                      <TableCell className="font-medium">{new Date(submission.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{submission.supplier_name ?? 'Unknown'}</TableCell>
                      <TableCell className="text-right font-mono">{Number(submission.total_emissions).toLocaleString()} kg</TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(submission)}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                  {(!submissions || submissions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No submissions yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Submission Details
            </DialogTitle>
            <DialogDescription>Review the extracted data and approve or reject this submission</DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="grid md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Source Document</h4>
                <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center border border-border">
                  <div className="text-center text-muted-foreground p-4">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{selectedSubmission.file_url ? 'View uploaded file' : 'No file uploaded'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Extracted Data</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Electricity', value: `${selectedSubmission.electricity} kWh` },
                    { label: 'Natural Gas', value: `${selectedSubmission.gas} m³` },
                    { label: 'Fuel', value: `${selectedSubmission.fuel} L` },
                    { label: 'Waste', value: `${selectedSubmission.waste} kg` },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-mono font-medium">{item.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between p-3 bg-accent rounded-lg">
                    <span className="font-medium text-foreground">Total CO₂e</span>
                    <span className="font-mono font-bold text-primary">{Number(selectedSubmission.total_emissions).toLocaleString()} kg</span>
                  </div>
                </div>

                {selectedSubmission.status === 'approved' && selectedSubmission.audit_hash && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-status-approved-bg rounded-lg border border-status-approved/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-status-approved" />
                      <span className="text-sm font-medium text-status-approved">Verified Audit Log</span>
                    </div>
                    <code className="text-xs font-mono text-muted-foreground break-all hash-chain block p-2 bg-background rounded">
                      {selectedSubmission.audit_hash}
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">
                      Verified at: {new Date(selectedSubmission.verified_at!).toLocaleString()}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedSubmission?.status === 'pending' ? (
              <>
                <Button variant="destructive" onClick={handleReject} disabled={updateStatusMutation.isPending}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={handleApprove} disabled={updateStatusMutation.isPending}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerDashboard;
