import { LayoutDashboard, FileText, Building2, Users, Shield, LogOut, BarChart3, FileBarChart, Bell, Webhook } from 'lucide-react';
import logoImg from '@/assets/esg-chain-logo.png';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const navItemKeys = [
  { key: 'nav.dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { key: 'nav.submissions', url: '/admin/submissions', icon: FileText },
  { key: 'nav.benchmarking', url: '/admin/benchmarking', icon: BarChart3 },
  { key: 'nav.reports', url: '/admin/reports', icon: FileBarChart },
  { key: 'nav.alerts', url: '/admin/alerts', icon: Bell },
  { key: 'nav.webhooks', url: '/admin/webhooks', icon: Webhook },
  { key: 'nav.organizations', url: '/admin/organizations', icon: Building2 },
  { key: 'nav.users', url: '/admin/users', icon: Users },
  { key: 'nav.auditTrail', url: '/admin/audit', icon: Shield },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'M';

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="p-4 flex items-center gap-3">
        <img src={logoImg} alt="ESG Chain" className="w-9 h-9 rounded-lg shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="text-sm font-semibold text-sidebar-foreground block truncate">ESG Chain</span>
            <span className="text-[11px] text-muted-foreground">{t('nav.commandCenter')}</span>
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{t('nav.navigation')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItemKeys.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          active ? 'bg-sidebar-accent text-sidebar-primary font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                        }`}
                        activeClassName=""
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span className="truncate">{t(item.key)}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{profile?.full_name}</p>
              <p className="text-[10px] text-muted-foreground">{t('auth.manager')}</p>
            </div>
          )}
          {!collapsed && (
            <Button variant="ghost" size="icon" className="shrink-0 w-7 h-7" onClick={handleLogout}>
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
