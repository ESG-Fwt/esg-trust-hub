import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { SupplierSidebar } from './SupplierSidebar';

interface SupplierLayoutProps {
  children: React.ReactNode;
}

export function SupplierLayout({ children }: SupplierLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SupplierSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 px-4">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1" />
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
