"use client";

import { useDeliveryState } from '@/hooks/useDeliveryState';
import { StatusToggle } from '@/components/delivery/StatusToggle';
import { ShiftTimer } from '@/components/delivery/ShiftTimer';
import { VehicleSelector } from '@/components/delivery/VehicleSelector';
import { User, Star, TrendingUp, DollarSign, Package, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { status, vehicle, shiftStartTime, toggleOnline, setVehicle } = useDeliveryState();

  const stats = [
    { icon: Package, label: 'Deliveries', value: '1,247' },
    { icon: Star, label: 'Rating', value: '4.9' },
    { icon: TrendingUp, label: 'Acceptance', value: '95%' },
    { icon: DollarSign, label: 'Earnings', value: '$3,450' },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="relative">
        <div className="h-32 gradient-primary" />
        <div className="max-w-2xl mx-auto px-4">
          <div className="relative -mt-16">
            <div className="flex items-end gap-4">
              <div className="w-28 h-28 rounded-2xl bg-card shadow-card border-4 border-background flex items-center justify-center">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
              <div className="pb-6">
                <h1 className="text-4xl font-bold text-white">Alex Driver</h1>
                <p className="text-lg text-muted-foreground">driver_alex_123</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="p-4 rounded-xl bg-card shadow-card text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Status section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Status Management</h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <StatusToggle status={status} onToggle={toggleOnline} />
            </div>
            <div className="flex-1">
              <ShiftTimer startTime={shiftStartTime} />
            </div>
          </div>
        </div>

        {/* Vehicle settings */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Vehicle Settings</h2>
          <VehicleSelector selected={vehicle} onChange={setVehicle} />
        </div>
        {/* Logout */}
        <button className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">Log Out</span>
        </button>
      </main>
    </div>
  );
}
