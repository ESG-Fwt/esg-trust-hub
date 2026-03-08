import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, CheckCircle, XCircle, FileText, Shield, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { submissionsApi, Submission } from '@/lib/submissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SubmissionsView = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Submission | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const { data: submissions } = useQuery({
    queryKey: ['submissions'],
    queryFn: submissionsApi.getWithProfiles,
    refetchInterval: 10000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      submissionsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const handleView = async (sub: Submission) => {
    setSelected(sub);
    setIsOpen(true);
    // Get signed URL for file preview
    if (sub.file_url) {
      const { data } = await supabase.storage.from('submissions').createSignedUrl(sub.file_url, 300);
      setFilePreviewUrl(data?.signedUrl ?? null);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleApprove = async () => {
    if (!selected) return;
    await updateMutation.mutateAsync({ id: selected.id, status: 'approved' });
    toast.success('Submission approved!');
    setIsOpen(false);
  };

  const handleReject = async () => {
    if (!selected) return;
    await updateMutation.mutateAsync({ id: selected.id, status: 'rejected' });
    toast.error('Submission rejected.');
    setIsOpen(false);
  };

  const filtered = submissions?.filter((s) => {
    const matchesSearch = !search || s.supplier_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-status-pending-bg text-status-pending border-status-pending/30 text-[11px]">Pending</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-status-approved-bg text-status-approved border-status-approved/30 text-[11px]">Approved</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-status-rejected-bg text-status-rejected border-status-rejected/30 text-[11px]">Rejected</Badge>;
      default: return <Badge variant="outline" className="text-[11px]">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Submissions</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and manage supplier ESG submissions</p>
        </div>
        <Badge variant="secondary" className="font-normal text-xs">
          {submissions?.length ?? 0} total
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <Filter className="w-3.5 h-3.5 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Supplier</TableHead>
                <TableHead className="text-xs text-right">Electricity</TableHead>
                <TableHead className="text-xs text-right">Gas</TableHead>
                <TableHead className="text-xs text-right">Fuel</TableHead>
                <TableHead className="text-xs text-right">Total CO₂e</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((sub, i) => (
                <motion.tr key={sub.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="group hover:bg-muted/30">
                  <TableCell className="text-xs font-medium">{new Date(sub.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs">{sub.supplier_name ?? 'Unknown'}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{Number(sub.electricity).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{Number(sub.gas).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{Number(sub.fuel).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right font-mono font-medium">{Number(sub.total_emissions).toLocaleString()} kg</TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleView(sub)} className="h-7 text-xs">
                      <Eye className="w-3.5 h-3.5 mr-1" /> View
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
              {(!filtered || filtered.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12 text-sm">
                    No submissions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Submission Details
            </DialogTitle>
            <DialogDescription>Review extracted data and source document</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="grid md:grid-cols-2 gap-6 py-4">
              {/* File Preview */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Source Document</h4>
                <div className="aspect-[3/4] bg-muted rounded-lg border border-border overflow-hidden">
                  {filePreviewUrl ? (
                    selected.file_url?.endsWith('.pdf') ? (
                      <iframe src={filePreviewUrl} className="w-full h-full" title="Document preview" />
                    ) : (
                      <img src={filePreviewUrl} alt="Document" className="w-full h-full object-contain" />
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="w-12 h-12 mb-2 opacity-40" />
                      <p className="text-sm">No file uploaded</p>
                    </div>
                  )}
                </div>
                {filePreviewUrl && (
                  <a href={filePreviewUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="w-3.5 h-3.5 mr-2" /> Download Original
                    </Button>
                  </a>
                )}
              </div>

              {/* Data Panel */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Extracted Data</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Electricity', value: `${selected.electricity} kWh` },
                    { label: 'Natural Gas', value: `${selected.gas} m³` },
                    { label: 'Fuel', value: `${selected.fuel} L` },
                    { label: 'Waste', value: `${selected.waste} kg` },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between p-3 bg-muted/50 rounded-lg text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-mono font-medium">{item.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between p-3 bg-accent rounded-lg text-sm">
                    <span className="font-medium text-foreground">Total CO₂e</span>
                    <span className="font-mono font-bold text-primary">{Number(selected.total_emissions).toLocaleString()} kg</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1 pt-2">
                  <p>Submitted: {new Date(selected.created_at).toLocaleString()}</p>
                  {selected.verified_at && <p>Verified: {new Date(selected.verified_at).toLocaleString()}</p>}
                </div>

                {selected.status === 'approved' && selected.audit_hash && (
                  <div className="p-3 bg-status-approved-bg rounded-lg border border-status-approved/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-3.5 h-3.5 text-status-approved" />
                      <span className="text-xs font-medium text-status-approved">Verified Audit Log</span>
                    </div>
                    <code className="text-[10px] font-mono text-muted-foreground break-all block">{selected.audit_hash}</code>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selected?.status === 'pending' ? (
              <>
                <Button variant="destructive" size="sm" onClick={handleReject} disabled={updateMutation.isPending}>
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button size="sm" onClick={handleApprove} disabled={updateMutation.isPending}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubmissionsView;
