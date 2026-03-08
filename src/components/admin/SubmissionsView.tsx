import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { submissionsApi, Submission } from '@/lib/submissions';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const SubmissionsView = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
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

  const handleExportCSV = () => {
    if (!filtered || filtered.length === 0) {
      toast.error(t('adminSub.noSubmissions'));
      return;
    }
    const csv = submissionsApi.exportCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esg-submissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('adminSub.exported'));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-status-pending-bg text-status-pending border-status-pending/30 text-[11px]">{t('dashboard.pending')}</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-status-approved-bg text-status-approved border-status-approved/30 text-[11px]">{t('dashboard.approved')}</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-status-rejected-bg text-status-rejected border-status-rejected/30 text-[11px]">{t('dashboard.rejected')}</Badge>;
      default: return <Badge variant="outline" className="text-[11px]">{t('common.unknown')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('adminSub.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('adminSub.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-8 text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" /> {t('adminSub.exportCSV')}
          </Button>
          <Badge variant="secondary" className="font-normal text-xs">
            {submissions?.length ?? 0} {t('common.total')}
          </Badge>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t('adminSub.searchSuppliers')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <Filter className="w-3.5 h-3.5 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('adminSub.allStatus')}</SelectItem>
            <SelectItem value="pending">{t('dashboard.pending')}</SelectItem>
            <SelectItem value="approved">{t('dashboard.approved')}</SelectItem>
            <SelectItem value="rejected">{t('dashboard.rejected')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{t('common.date')}</TableHead>
                <TableHead className="text-xs">{t('auth.supplier')}</TableHead>
                <TableHead className="text-xs text-right">{t('energy.electricity')}</TableHead>
                <TableHead className="text-xs text-right">{t('energy.naturalGas')}</TableHead>
                <TableHead className="text-xs text-right">{t('energy.fuel')}</TableHead>
                <TableHead className="text-xs text-right">{t('energy.water')}</TableHead>
                <TableHead className="text-xs text-right">Total CO₂e</TableHead>
                <TableHead className="text-xs">{t('common.status')}</TableHead>
                <TableHead className="text-xs text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((sub, i) => (
                <motion.tr key={sub.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="group hover:bg-muted/30 cursor-pointer"
                  onClick={() => navigate(`/admin/review/${sub.id}`)}
                >
                  <TableCell className="text-xs font-medium">{new Date(sub.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs">{sub.supplier_name ?? t('common.unknown')}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{Number(sub.electricity).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{Number(sub.gas).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{Number(sub.fuel).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{Number(sub.water).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right font-mono font-medium">{Number(sub.total_emissions).toLocaleString()} kg</TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('adminSub.review')} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
              {(!filtered || filtered.length === 0) && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-12 text-sm">
                    {t('adminSub.noSubmissions')}
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
