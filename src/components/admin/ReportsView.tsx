import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { submissionsApi, Submission } from '@/lib/submissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileDown, FileSpreadsheet, FileText, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const frameworkMappings = [
  { id: 'csrd', name: 'CSRD / ESRS E1', description: 'Climate Change – Scope 1 & 2 GHG emissions', fields: ['electricity', 'gas', 'fuel'] },
  { id: 'cdp', name: 'CDP Climate', description: 'C6.1 – Gross global Scope 1 & 2 emissions', fields: ['electricity', 'gas', 'fuel', 'waste'] },
  { id: 'gri', name: 'GRI 305', description: 'GRI 305-1/305-2 – Direct & Energy indirect GHG', fields: ['electricity', 'gas', 'fuel'] },
  { id: 'vsme', name: 'VSME / EFRAG', description: 'Voluntary SME Sustainability Standard', fields: ['electricity', 'gas', 'fuel', 'waste', 'water'] },
];

const ReportsView = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions-reports'],
    queryFn: submissionsApi.getWithProfiles,
  });

  const filtered = submissions?.filter((s) => statusFilter === 'all' || s.status === statusFilter) ?? [];

  const totals = filtered.reduce(
    (acc, s) => ({
      electricity: acc.electricity + Number(s.electricity),
      gas: acc.gas + Number(s.gas),
      fuel: acc.fuel + Number(s.fuel),
      waste: acc.waste + Number(s.waste),
      water: acc.water + Number(s.water),
      emissions: acc.emissions + Number(s.total_emissions),
    }),
    { electricity: 0, gas: 0, fuel: 0, waste: 0, water: 0, emissions: 0 }
  );

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const csv = submissionsApi.exportCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `esg-compliance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast({ title: t('reports.csvExported') });
  };

  const handleExportFramework = (fw: typeof frameworkMappings[0]) => {
    const headers = ['Framework', 'Standard', 'Supplier', 'Date', ...fw.fields.map((f) => f.charAt(0).toUpperCase() + f.slice(1)), 'Total CO₂e (kg)', 'Status'];
    const rows = filtered.map((s) => [
      fw.name,
      fw.description,
      s.supplier_name ?? 'Unknown',
      new Date(s.created_at).toLocaleDateString(),
      ...fw.fields.map((f) => String((s as unknown as Record<string, unknown>)[f] ?? 0)),
      String(s.total_emissions),
      s.status,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fw.id}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast({ title: `${fw.name} ${t('reports.exported')}` });
  };

  const approvedCount = submissions?.filter((s) => s.status === 'approved').length ?? 0;
  const totalCount = submissions?.length ?? 0;
  const complianceRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('reports.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('reports.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('adminSub.allStatus')}</SelectItem>
              <SelectItem value="approved">{t('dashboard.approved')}</SelectItem>
              <SelectItem value="pending">{t('dashboard.pending')}</SelectItem>
              <SelectItem value="rejected">{t('dashboard.rejected')}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportCSV} disabled={filtered.length === 0} size="sm">
            <FileDown className="w-4 h-4 mr-2" />
            {t('reports.exportAll')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[40vh] gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <>
          {/* Compliance Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="enterprise-card">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{complianceRate}%</p>
                  <p className="text-xs text-muted-foreground">{t('reports.complianceRate')}</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <Card className="enterprise-card">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-status-approved-bg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-status-approved" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{approvedCount}</p>
                  <p className="text-xs text-muted-foreground">{t('reports.verifiedSubmissions')}</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
              <Card className="enterprise-card">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{(totals.emissions / 1000).toFixed(1)}t</p>
                  <p className="text-xs text-muted-foreground">{t('reports.totalReportedEmissions')}</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Data Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.dataBreakdown')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  { label: t('energy.electricity'), value: totals.electricity, unit: 'kWh' },
                  { label: t('energy.naturalGas'), value: totals.gas, unit: 'm³' },
                  { label: t('energy.fuel'), value: totals.fuel, unit: 'L' },
                  { label: t('energy.waste'), value: totals.waste, unit: 'kg' },
                  { label: t('energy.water'), value: totals.water, unit: 'm³' },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-foreground">{item.value.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{item.label} ({item.unit})</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Framework Reports */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">{t('reports.regulatoryFrameworks')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {frameworkMappings.map((fw, i) => (
                <motion.div key={fw.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="enterprise-card">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{fw.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{fw.description}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{fw.fields.length} {t('reports.metrics')}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {fw.fields.map((f) => (
                          <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleExportFramework(fw)}
                        disabled={filtered.length === 0}
                      >
                        <FileDown className="w-3.5 h-3.5 mr-2" />
                        {t('reports.exportReport')}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsView;
