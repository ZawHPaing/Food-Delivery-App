"use client";

import { ClipboardList, UtensilsCrossed, Truck, DollarSign, TrendingUp, Users, ArrowUpRight, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRestaurant } from '@/context/RestaurantContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Index() {
  const { orders, menuItems, deliveries, riders } = useRestaurant();

  const paidOrders = orders.filter(o => o.status === 'Paid').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_cents, 0);
  const availableItems = menuItems.filter(m => m.is_available).length;
  const activeDeliveries = deliveries.filter(d => d.status !== 'Delivered').length;
  const availableRiders = riders.filter(r => r.is_available).length;

  return (
    <div className="space-y-8 animate-enter">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-foreground tracking-tight">
                  Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#e4002b] to-[#ff6600]">La Terrazza</span>
                </h2>
                <p className="text-muted-foreground text-lg mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ff6600] animate-pulse" />
                  Your restaurant is currently <span className="text-[#ff6600] font-bold">Open</span> for orders
                </p>
        </div>
        <div className="flex bg-secondary/50 p-1 rounded-xl items-center">
          <Button variant="ghost" size="sm" className="rounded-lg shadow-sm bg-background text-foreground">Today</Button>
          <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground hover:text-foreground">Week</Button>
          <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground hover:text-foreground">Month</Button>
        </div>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue - Large Card */}
        <Card className="col-span-1 md:col-span-2 glass-card border-none bg-gradient-to-br from-[#e4002b]/5 via-[#ff6600]/10 to-transparent shadow-soft relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#e4002b]/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-[#ff6600]/20" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#e4002b] uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-5xl font-bold tracking-tighter text-foreground">
                ${(totalRevenue / 100).toFixed(2)}
              </div>
              <div className="flex items-center text-sm font-bold text-success bg-success/10 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5%
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Significant increase from yesterday's earnings of $1,204.00
            </p>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card className="glass-card shadow-card hover:shadow-glow transition-all duration-300 border-l-4 border-l-[#e4002b]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
            <div className="p-2 bg-[#e4002b]/10 rounded-lg text-[#e4002b]">
              <ClipboardList className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{paidOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Orders waiting for dispatch</p>
            <div className="w-full bg-secondary h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-gradient-to-r from-[#e4002b] to-[#ff6600] h-full rounded-full" style={{ width: `${Math.min((paidOrders / 20) * 100, 100)}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Active Deliveries */}
        <Card className="glass-card shadow-card hover:shadow-glow transition-all duration-300 border-l-4 border-l-[#ff6600]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Transit</CardTitle>
            <div className="p-2 bg-[#ff6600]/10 rounded-lg text-[#ff6600]">
              <Truck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeDeliveries}</div>
            <p className="text-xs text-muted-foreground mt-1">Active delivery partners</p>
            <div className="flex -space-x-2 mt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold">
                  D{i}
                </div>
              ))}
              {activeDeliveries > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold">
                  +{activeDeliveries - 3}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Menu Stats */}
        <Card className="glass-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Menu Availability</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableItems}/{menuItems.length}</div>
            <p className="text-xs text-muted-foreground">Items active on menu</p>
          </CardContent>
        </Card>

        {/* Riders Stats */}
        <Card className="glass-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Riders Nearby</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableRiders}</div>
            <p className="text-xs text-muted-foreground">Ready for dispatch</p>
          </CardContent>
        </Card>

        {/* Quick Action - Add Item (Mock) */}
        <Card className="glass-card border-dashed border-2 bg-transparent hover:bg-secondary/30 transition-colors cursor-pointer flex items-center justify-center group">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-[#e4002b]/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform text-[#e4002b]">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground">View Reports</h3>
            <p className="text-xs text-muted-foreground">Analyze performance</p>
          </div>
        </Card>
      </div>

      {/* Quick Actions / Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/restaurant_module/orders" className="group">
          <Card className="h-full border-[#e4002b]/20 bg-gradient-to-br from-[#e4002b]/5 to-transparent hover:from-[#e4002b]/10 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white rounded-2xl shadow-soft group-hover:scale-110 transition-transform">
                  <ClipboardList className="w-6 h-6 text-[#e4002b]" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-xl">Manage Orders</CardTitle>
              <CardDescription className="text-base mt-2">
                You have <span className="text-[#e4002b] font-bold">{paidOrders} new orders</span> waiting to be prepared and dispatched.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/restaurant_module/menu" className="group">
          <Card className="h-full border-[#ff6600]/20 bg-gradient-to-br from-[#ff6600]/5 to-transparent hover:from-[#ff6600]/10 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white rounded-2xl shadow-soft group-hover:scale-110 transition-transform">
                  <UtensilsCrossed className="w-6 h-6 text-[#ff6600]" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-xl">Update Menu</CardTitle>
              <CardDescription className="text-base mt-2">
                Manage your dishes, update prices, and control item availability for your customers.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
