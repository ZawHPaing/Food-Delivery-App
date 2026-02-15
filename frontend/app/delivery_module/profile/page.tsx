"use client";

import { useDeliveryState } from '@/hooks/useDeliveryState';
import { StatusToggle } from '@/components/delivery/StatusToggle';
import { ShiftTimer } from '@/components/delivery/ShiftTimer';
import { VehicleSelector } from '@/components/delivery/VehicleSelector';
import { User, Star, TrendingUp, DollarSign, Package, LogOut } from 'lucide-react';
import { DriverStatus } from '@/types/delivery';
import { useAuth } from '@/app/_providers/AuthProvider';
import LoginOverlay from '@/components/ui/LoginOverlay';
import SignupOverlay from '@/components/ui/SignupOverlay';
import { useState } from 'react';

export default function ProfilePage() {
  const { status, vehicle, shiftStartTime, toggleOnline, setVehicle } = useDeliveryState();
  const { isLoggedIn, user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // Safely read deliveries from user
  const deliveries = (user as any)?.deliveries as Array<{ delivery_fee_cents?: number }> ?? [];
  const deliveriesCount = deliveries.length;
  const earningsCents = deliveries.reduce(
    (sum: number, d: { delivery_fee_cents?: number }) => sum + (d.delivery_fee_cents ?? 0),
    0
  );
  const earningsDisplay = `${earningsCents.toLocaleString()} MMK`;
  // Map backend status strings ('available'|'unavailable'|'busy') to DriverStatus
  const backendToDriverStatus = (s: string | undefined): DriverStatus =>
    s === 'available' ? 'online' : s === 'busy' ? 'busy' : 'offline';
  const driverStatusToBackend = (s: DriverStatus) =>
    s === 'online' ? 'available' : s === 'busy' ? 'busy' : 'unavailable';

  const initialStatus = backendToDriverStatus((user as any)?.rider?.status);
  const [availability, setAvailability] = useState<DriverStatus>(initialStatus ?? 'offline');

  // Toggle status and persist to backend `delivery/profile` endpoint
  async function handleToggleStatus() {
    const nextDriverStatus: DriverStatus = availability === 'online' ? 'offline' : 'online';
    const nextStatusBackend = driverStatusToBackend(nextDriverStatus);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    try {
      const riderId = (user as any)?.rider?.id;
      if (!riderId) {
        console.error('No rider id available to update status');
        return;
      }

      const url = `http://localhost:8000/delivery/status?rider_id=${encodeURIComponent(riderId)}&status=${encodeURIComponent(nextStatusBackend)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        const msg = `Failed to update status: ${bodyText || res.statusText || `status ${res.status}`}`;
        console.error(msg);
        return;
      }

      const data = await res.json();
      // backend returns { success: true, status: "available" }
      if (data?.success && data?.status) {
        setAvailability(backendToDriverStatus(data.status));
        try {
          toggleOnline();
        } catch (err) {
          // ignore
        }
      }
    } catch (err) {
      console.error(`Error updating status: ${String(err)}`);
    }
  }
  const stats = [
    { icon: Package, label: 'Deliveries', value: String(deliveriesCount) },
    { icon: Star, label: 'Rating', value: '4.9' },
    { icon: TrendingUp, label: 'Acceptance', value: '95%' },
    { icon: DollarSign, label: 'Earnings', value: earningsDisplay },
  ];

  // Display values directly from `user`
  const displayEmail = user?.email ?? '';
  const displayFirstName = user?.first_name ?? '';
  const displayLastName = user?.last_name ?? '';
  const displayName = `${displayFirstName} ${displayLastName}`.trim();

  return (
    <div className="min-h-screen pb-24">
      {!isLoggedIn ? (
        <main className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
          <h1 className="text-3xl font-bold">You are logged out</h1>
          <p className="text-muted-foreground">
            Please log in or create an account to access your profile.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowLogin(true)}
              className="px-5 py-2 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50"
            >
              Log in
            </button>
            <button
              onClick={() => setShowSignup(true)}
              className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-[#e4002b] to-[#ff6600] border-none"
            >
              Sign up
            </button>
          </div>
        </main>
      ) : (
        <>
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
                    <h1 className="text-4xl font-bold text-white">{displayName || 'Alex Driver'}</h1>
                    <p className="text-lg text-muted-foreground">{displayEmail || 'driver_alex_123'}</p>
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
                  <StatusToggle status={availability} onToggle={handleToggleStatus} />
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
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-semibold">Log Out</span>
            </button>
          </main>
        </>
      )}

      {/* Auth Modals */}
      <LoginOverlay
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
        onLoginSuccess={() => setShowLogin(false)}
      />
      <SignupOverlay
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSwitchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />
    </div>
  );
}
