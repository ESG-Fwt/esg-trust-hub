import { Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function EuSovereigntyBadge({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-0.5">
          <span className="text-[10px]">🇪🇺</span>
          <Shield className="w-3 h-3" />
        </div>
        <span>{t('eu.badge')}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border bg-muted/50 text-xs">
      <div className="flex items-center gap-1">
        <span className="text-sm">🇪🇺</span>
        <Shield className="w-3.5 h-3.5 text-primary" />
      </div>
      <div>
        <p className="font-medium text-foreground">{t('eu.badge')}</p>
        <p className="text-[10px] text-muted-foreground">{t('eu.badgeDesc')}</p>
      </div>
    </div>
  );
}
