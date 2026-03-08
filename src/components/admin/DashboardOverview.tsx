import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Factory, Users, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { submissionsApi } from '@/lib/submissions';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = [
  'hsl(152, 60%, 40%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(215, 20%, 60%)',
];

const DashboardOverview = () => {
  const navigate = useNavigate();
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

  // Build chart data from real submissions
  const emissionsByMonth = (() => {
    if (!submissions) return [];
    const months: Record<string, { electricity: number; gas: number; fuel: number; waste: number }> = {};
    submissions.forEach((s) => {
      const key = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { electricity: 0, gas: 0, fuel: 0, waste: 0 };
      months[key].electricity += Number(s.electricity);
      months[key].gas += Number(s.gas);
      months[key].fuel += Number(s.fuel);
      months[key].waste += Number(s.waste);
    });
    return Object.entries(months).map(([month, data]) => ({ month, ...data }));
  })();

  const statusDistribution = (() => {
    if (!submissions) return [];
    const counts = { pending: 0, approved: 0, rejected: 0 };
    submissions.forEach((s) => {
      if (s.status in counts) counts[s.status as keyof typeof counts]++;
    });
    return [
      { name: 'Pending', value: counts.pending, color: 'hsl(38, 92%, 50%)' },
      { name: 'Approved', value: counts.approved, color: 'hsl(152, 60%, 40%)' },
      { name: 'Rejected', value: counts.rejected, color: 'hsl(0, 72%, 51%)' },
    ].filter((d) => d.value > 0);
  })();

  const statCards = [
    { title: 'Pending Reviews', value: stats?.pendingReviews ?? 0, icon: Clock, color: 'text-status-pending', bgColor: 'bg-status-pending-bg', trend: null },
    { title: 'Compliance Rate', value: `${stats?.complianceRate ?? 0}%`, icon: TrendingUp, color: 'text-primary', bgColor: 'bg-accent', trend: '+4.2%' },
    { title: 'Total Emissions', value: `${((stats?.totalEmissions ?? 0) / 1000).toFixed(1)}t`, icon: Factory, color: 'text-slate-600', bgColor: 'bg-slate-100', trend: '-2.1%' },
    { title: 'Active Suppliers', value: stats?.activeSuppliers ?? 0, icon: Users, color: 'text-primary', bgColor: 'bg-accent', trend: null },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time ESG compliance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="enterprise-card relative overflow-hidden">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  {stat.trend && (
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${
                      stat.trend.startsWith('+') ? 'text-status-approved' : 'text-status-rejected'
                    }`}>
                      {stat.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stat.trend}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Emissions Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Emissions by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {emissionsByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={emissionsByMonth}>
                  <defs>
                    <linearGradient id="colorElec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 45%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 45%)" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(215, 20%, 91%)', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="electricity" stroke={CHART_COLORS[0]} fill="url(#colorElec)" strokeWidth={2} name="Electricity (kWh)" />
                  <Area type="monotone" dataKey="gas" stroke={CHART_COLORS[1]} fill="url(#colorGas)" strokeWidth={2} name="Gas (m³)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                      {statusDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2">
                  {statusDistribution.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="font-medium text-foreground">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {submissions?.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-6 py-3 cursor-pointer hover:bg-muted/30 transition-colors group"
                onClick={() => navigate(`/admin/review/${s.id}`)}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  s.status === 'approved' ? 'bg-status-approved' : s.status === 'rejected' ? 'bg-status-rejected' : 'bg-status-pending'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.supplier_name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-mono text-foreground">{Number(s.total_emissions).toLocaleString()} kg</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
            {(!submissions || submissions.length === 0) && (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">No submissions yet</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
