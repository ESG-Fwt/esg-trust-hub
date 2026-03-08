import { useQuery } from '@tanstack/react-query';
import { submissionsApi, Submission } from '@/lib/submissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMemo } from 'react';

interface SupplierRanking {
  name: string;
  totalEmissions: number;
  submissions: number;
  electricity: number;
  gas: number;
  fuel: number;
  waste: number;
  water: number;
  avgEmissions: number;
}

const BenchmarkingView = () => {
  const { t } = useLanguage();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions-benchmark'],
    queryFn: submissionsApi.getWithProfiles,
  });

  const rankings = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];

    const bySupplier: Record<string, SupplierRanking> = {};

    submissions.forEach((s) => {
      const name = s.supplier_name ?? 'Unknown';
      if (!bySupplier[name]) {
        bySupplier[name] = { name, totalEmissions: 0, submissions: 0, electricity: 0, gas: 0, fuel: 0, waste: 0, water: 0, avgEmissions: 0 };
      }
      bySupplier[name].totalEmissions += Number(s.total_emissions);
      bySupplier[name].submissions += 1;
      bySupplier[name].electricity += Number(s.electricity);
      bySupplier[name].gas += Number(s.gas);
      bySupplier[name].fuel += Number(s.fuel);
      bySupplier[name].waste += Number(s.waste);
      bySupplier[name].water += Number(s.water);
    });

    return Object.values(bySupplier)
      .map((s) => ({ ...s, avgEmissions: Math.round(s.totalEmissions / s.submissions) }))
      .sort((a, b) => a.totalEmissions - b.totalEmissions);
  }, [submissions]);

  const barData = useMemo(() => {
    return rankings.map((r) => ({
      name: r.name.length > 15 ? r.name.slice(0, 15) + '…' : r.name,
      fullName: r.name,
      emissions: r.totalEmissions,
      avg: r.avgEmissions,
    }));
  }, [rankings]);

  const radarData = useMemo(() => {
    if (rankings.length === 0) return [];
    const maxE = Math.max(...rankings.map((r) => r.electricity)) || 1;
    const maxG = Math.max(...rankings.map((r) => r.gas)) || 1;
    const maxF = Math.max(...rankings.map((r) => r.fuel)) || 1;
    const maxW = Math.max(...rankings.map((r) => r.waste)) || 1;
    const maxWa = Math.max(...rankings.map((r) => r.water)) || 1;

    const categories = [
      { category: t('energy.electricity'), key: 'electricity', max: maxE },
      { category: t('energy.naturalGas'), key: 'gas', max: maxG },
      { category: t('energy.fuel'), key: 'fuel', max: maxF },
      { category: t('energy.waste'), key: 'waste', max: maxW },
      { category: t('energy.water'), key: 'water', max: maxWa },
    ];

    return categories.map((c) => {
      const row: Record<string, string | number> = { category: c.category };
      rankings.slice(0, 5).forEach((r) => {
        row[r.name] = Math.round(((r as Record<string, unknown>)[c.key] as number / c.max) * 100);
      });
      return row;
    });
  }, [rankings, t]);

  const radarColors = ['hsl(152, 60%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(215, 60%, 50%)', 'hsl(280, 60%, 50%)', 'hsl(0, 72%, 51%)'];

  const avgAll = useMemo(() => {
    if (rankings.length === 0) return 0;
    return Math.round(rankings.reduce((s, r) => s + r.totalEmissions, 0) / rankings.length);
  }, [rankings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('benchmark.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('benchmark.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[40vh] gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : rankings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            {t('common.noData')}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="enterprise-card">
                <CardContent className="pt-5 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">{t('benchmark.totalSuppliers')}</p>
                  <p className="text-3xl font-bold text-foreground">{rankings.length}</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <Card className="enterprise-card">
                <CardContent className="pt-5 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">{t('benchmark.avgEmissions')}</p>
                  <p className="text-3xl font-bold text-foreground">{avgAll.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">kg CO₂e</span></p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
              <Card className="enterprise-card">
                <CardContent className="pt-5 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">{t('benchmark.bestPerformer')}</p>
                  <p className="text-lg font-bold text-foreground truncate">{rankings[0]?.name ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">{rankings[0]?.totalEmissions.toLocaleString() ?? 0} kg CO₂e</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('benchmark.emissionsRanking')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(280, rankings.length * 40)}>
                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 91%)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 45%)" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 45%)" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(215, 20%, 91%)', fontSize: '12px' }}
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString()} kg CO₂e`,
                      name === 'emissions' ? t('benchmark.totalEmissionsLabel') : t('benchmark.avgPerSubmission'),
                    ]}
                  />
                  <Bar dataKey="emissions" fill="hsl(152, 60%, 40%)" radius={[0, 4, 4, 0]} name="emissions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radar Chart - Top 5 */}
          {rankings.length >= 2 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('benchmark.categoryComparison')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(215, 20%, 91%)" />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fontSize: 9 }} />
                    {rankings.slice(0, 5).map((r, i) => (
                      <Radar key={r.name} name={r.name} dataKey={r.name} stroke={radarColors[i]} fill={radarColors[i]} fillOpacity={0.15} strokeWidth={2} />
                    ))}
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Supplier Ranking Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('benchmark.supplierTable')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {rankings.map((r, i) => {
                  const isAboveAvg = r.totalEmissions > avgAll;
                  return (
                    <motion.div
                      key={r.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-4 px-6 py-3"
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.submissions} {t('benchmark.submissions')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-foreground">{r.totalEmissions.toLocaleString()} kg</p>
                        <div className="flex items-center gap-1 justify-end">
                          {isAboveAvg ? (
                            <TrendingUp className="w-3 h-3 text-destructive" />
                          ) : r.totalEmissions === avgAll ? (
                            <Minus className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-status-approved" />
                          )}
                          <span className={`text-[10px] ${isAboveAvg ? 'text-destructive' : 'text-status-approved'}`}>
                            {isAboveAvg ? t('benchmark.aboveAvg') : t('benchmark.belowAvg')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default BenchmarkingView;
