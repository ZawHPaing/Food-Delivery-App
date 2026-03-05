import { ClipboardList, UtensilsCrossed, LayoutDashboard, LogOut, PanelLeft } from 'lucide-react';
import { NavLink } from '@/components/restaurant/NavLink';
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const navigationItems = [
  { title: 'Dashboard', url: '/restaurant_module', icon: LayoutDashboard },
  { title: 'Orders', url: '/restaurant_module/orders', icon: ClipboardList },
  { title: 'Menu', url: '/restaurant_module/menu', icon: UtensilsCrossed },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const router = useRouter();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card/50 backdrop-blur-xl z-30">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#e4002b] to-[#ff6600] shadow-glow text-white shrink-0">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="animate-enter whitespace-nowrap">
                <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#e4002b] to-[#ff6600]">
                  FoodHub
                </h2>
                <p className="text-[10px] text-muted-foreground font-medium">Restaurant Admin</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "h-8 w-8 rounded-lg hover:bg-secondary/50",
              isCollapsed && "mx-auto"
            )}
          >
            <PanelLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} className="h-12 rounded-xl transition-all duration-200">
                    <NavLink
                      href={item.url}
                      exact={item.url === '/restaurant_module'}
                      className="flex items-center gap-3 px-4 w-full h-full hover:bg-[#e4002b]/5 hover:text-[#e4002b] data-[active=true]:bg-[#e4002b]/10 data-[active=true]:text-[#e4002b]"
                      activeClassName="bg-[#e4002b]/10 text-[#e4002b] font-semibold shadow-sm"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-base">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-12 rounded-xl text-[#e4002b] hover:bg-[#e4002b]/10"
              onClick={() => router.push('/restaurant_portal')}
            >
              <LogOut className="h-5 w-5" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
