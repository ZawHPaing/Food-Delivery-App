"use client";

import { ReactNode, useState, FormEvent } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/restaurant/layout/AppSidebar';
import { Bell, Search, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RestaurantProvider } from '@/context/RestaurantContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster as Sonner } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: "Admin User",
    role: "Manager",
    restaurantName: "La Terrazza",
    email: "admin@restaurant.com",
    phone: "+95 9 7777 88888",
  });

  const handleProfileSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProfileOpen(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RestaurantProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full overflow-hidden">
              <AppSidebar />
              <main className="flex-1 flex flex-col min-w-0 bg-[#fff5f0] selection:bg-[#e4002b]/20 relative">
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
                    <Button
                      variant="ghost"
                      className="gap-2 rounded-xl pl-2 pr-4"
                      onClick={() => setIsProfileOpen(true)}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#e4002b] to-[#ff6600] flex items-center justify-center text-white">
                        <UserCircle className="w-5 h-5" />
                      </div>
                      <div className="text-left hidden sm:block">
                        <p className="text-sm font-semibold leading-none">{profile.name}</p>
                        <p className="text-xs text-muted-foreground">{profile.role}</p>
                      </div>
                    </Button>
                  </div>
                </header>

                <div className="flex-1 p-6 md:p-8 overflow-auto z-10">
                  <div className="max-w-7xl mx-auto space-y-6">
                    {children}
                  </div>
                </div>

                <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Edit restaurant profile</DialogTitle>
                      <DialogDescription>
                        Update your restaurant and admin information.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Admin name
                          </label>
                          <Input
                            value={profile.name}
                            onChange={(e) =>
                              setProfile({ ...profile, name: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                          </label>
                          <Input
                            value={profile.role}
                            onChange={(e) =>
                              setProfile({ ...profile, role: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Restaurant name
                        </label>
                        <Input
                          value={profile.restaurantName}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              restaurantName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact email
                          </label>
                          <Input
                            type="email"
                            value={profile.email}
                            onChange={(e) =>
                              setProfile({ ...profile, email: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone number
                          </label>
                          <Input
                            value={profile.phone}
                            onChange={(e) =>
                              setProfile({ ...profile, phone: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter className="pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white"
                        >
                          Save changes
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </main>
              <Sonner />
            </div>
          </SidebarProvider>
        </RestaurantProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
