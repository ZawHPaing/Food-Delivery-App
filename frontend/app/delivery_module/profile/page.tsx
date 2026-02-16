"use client";

import { useDeliveryState } from '@/hooks/useDeliveryState';
import { StatusToggle } from '@/components/delivery/StatusToggle';
import { VehicleSelector } from '@/components/delivery/VehicleSelector';
import { User, Star, DollarSign, Package, Truck } from 'lucide-react';
import { DriverStatus, VehicleType } from '@/types/delivery';
import { useAuth } from '@/app/_providers/AuthProvider';
import LoginOverlay from '@/components/ui/LoginOverlay';
import SignupOverlay from '@/components/ui/SignupOverlay';
import { useMemo, useState, useEffect } from 'react';
import { DeliveryNavbar } from '@/components/delivery/DeliveryNavbar';

export default function ProfilePage() {
  const { vehicle, setVehicle, status, updateStatus } = useDeliveryState();
  const { isLoggedIn, user } = useAuth();
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
  
  // Toggle status using the centralized hook
  const handleToggleStatus = () => {
    const nextStatus = status === 'available' ? 'unavailable' : 'available';
    updateStatus(nextStatus);
  };
    const licensePlate = (user as any)?.rider?.license_plate ?? 'N/A';
    const stats = [
      { icon: Package, label: 'Deliveries', value: String(deliveriesCount) },
      { icon: Truck, label: 'Vehicle Plate', value: licensePlate },
      { icon: DollarSign, label: 'Earnings', value: earningsDisplay },
    ];

  // Map registered vehicle from backend rider profile to UI vehicle type
  const registeredVehicle: VehicleType | null = useMemo(() => {
    const raw = user?.rider?.vehicle_type?.toLowerCase();
    if (!raw) return null;
    if (raw === 'car' || raw === 'van' || raw === 'truck' || raw === 'bus') return 'car';
    if (raw === 'bike' || raw === 'bicycle' || raw === 'motorbike' || raw === 'scooter') return 'bike';
    return null;
  }, [user?.rider?.vehicle_type]);

  const displayVehicle: VehicleType = registeredVehicle ?? vehicle;
  const allowedVehicleTypes: VehicleType[] = [displayVehicle];

  const handleVehicleChange = () => {
    // Vehicle type is fixed; no switching from this screen
  };

  // Display values directly from `user`
  const displayEmail = user?.email ?? '';
  const displayFirstName = user?.first_name ?? '';
  const displayLastName = user?.last_name ?? '';
  const displayName = `${displayFirstName} ${displayLastName}`.trim();

  return (
    <div className="min-h-screen pb-24">
      <DeliveryNavbar
        onLoginClick={() => setShowLogin(true)}
        onSignupClick={() => setShowSignup(true)}
      />
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
            <div className="h-24 gradient-primary" />
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <StatusToggle status={status} onToggle={handleToggleStatus} />
            </div>

            {/* Vehicle settings */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Vehicle Settings</h2>
              <VehicleSelector
                selected={displayVehicle}
                onChange={handleVehicleChange}
                allowedTypes={allowedVehicleTypes}
              />
            </div>

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
