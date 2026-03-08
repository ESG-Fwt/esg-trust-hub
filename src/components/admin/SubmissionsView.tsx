import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { submissionsApi, Submission } from '@/lib/submissions';
import { useQuery } from '@tanstack/react-query';

const SubmissionsView = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: submissions } = useQuery({
    queryKey: ['submissions'],
    queryFn: submissionsApi.getWithProfiles,
    refetchInterval: 10000,
  });

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
                <motion.tr key={sub.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="group hover:bg-muted/30 cursor-pointer"
                  onClick={() => navigate(`/admin/review/${sub.id}`)}
                >
                  <TableCell className="text-xs font-medium">{new Date(sub.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs">{sub.supplier_name ?? 'Unknown'}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{Number(sub.electricity).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{Number(sub.gas).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{Number(sub.fuel).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right font-mono font-medium">{Number(sub.total_emissions).toLocaleString()} kg</TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      Review <ChevronRight className="w-3.5 h-3.5 ml-1" />
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

    </div>
  );
};

export default SubmissionsView;
