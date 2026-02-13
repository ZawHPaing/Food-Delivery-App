"use client";

import { ReactNode, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/restaurant/layout/AppSidebar';
import { Bell, Search, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RestaurantProvider } from '@/context/RestaurantContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster as Sonner } from "@/components/ui/sonner";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RestaurantProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full overflow-hidden">
              <AppSidebar />
              <main className="flex-1 flex flex-col min-w-0 bg-[#fff5f0] selection:bg-[#e4002b]/20 relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] pointer-events-none" />

                <header className="h-16 px-6 glass border-b border-border/50 flex items-center justify-between sticky top-0 z-20">
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search orders..."
                        className="pl-9 h-10 rounded-xl bg-secondary/50 border-transparent focus:bg-background focus:border-[#ff6600]/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-[#e4002b] relative">
                      <Bell className="w-5 h-5" />
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#e4002b] animate-pulse" />
                    </Button>
                    <div className="h-8 w-[1px] bg-border/50 mx-1" />
                    <Button variant="ghost" className="gap-2 rounded-xl hover:bg-secondary/50 pl-2 pr-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#e4002b] to-[#ff6600] flex items-center justify-center text-white">
                        <UserCircle className="w-5 h-5" />
                      </div>
                      <div className="text-left hidden sm:block">
                        <p className="text-sm font-semibold leading-none">Admin User</p>
                        <p className="text-xs text-muted-foreground">Manager</p>
                      </div>
                    </Button>
                  </div>
                </header>

                <div className="flex-1 p-6 md:p-8 overflow-auto z-10">
                  <div className="max-w-7xl mx-auto space-y-6">
                    {children}
                  </div>
                </div>
              </main>
              <Sonner />
            </div>
          </SidebarProvider>
        </RestaurantProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
