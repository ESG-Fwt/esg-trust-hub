import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { submissionsApi } from '@/lib/submissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, RotateCcw, FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const actionConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  CREATED: { icon: FileText, color: 'text-primary', bgColor: 'bg-accent' },
  APPROVED: { icon: CheckCircle, color: 'text-status-approved', bgColor: 'bg-status-approved-bg' },
  REVISION_REQUESTED: { icon: RotateCcw, color: 'text-status-rejected', bgColor: 'bg-status-rejected-bg' },
};

const AdminAuditTrail = () => {
  const { t } = useLanguage();
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: submissionsApi.getAuditLogs,
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('audit.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('audit.subtitle')}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-[40vh] gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : !logs || logs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
              {t('audit.noLogs')}
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {logs.map((log, i) => {
                const config = actionConfig[log.action] ?? actionConfig.CREATED;
                const Icon = config.icon;
                const meta = log.metadata as Record<string, unknown> | null;

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="relative pl-14"
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-3.5 w-5 h-5 rounded-full ${config.bgColor} flex items-center justify-center border-2 border-background`}>
                      <Icon className={`w-3 h-3 ${config.color}`} />
                    </div>

                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {log.action}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {log.submission_id.slice(0, 8)}
                          </span>
                        </div>
                        <code className="text-[10px] font-mono text-muted-foreground break-all block">
                          {log.hash}
                        </code>
                        {meta && 'revision_notes' in meta && (
                          <p className="text-xs text-foreground mt-2 p-2 rounded bg-muted">
                            {String(meta.revision_notes)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

import React from 'react';
export default AdminAuditTrail;
