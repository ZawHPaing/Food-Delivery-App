"use client";

import { useDeliveryState } from '@/hooks/useDeliveryState';
import { StatusToggle } from '@/components/delivery/StatusToggle';
import { VehicleSelector } from '@/components/delivery/VehicleSelector';
import { User, Star, DollarSign, Package, Truck, Banknote } from 'lucide-react';
import { DriverStatus, VehicleType } from '@/types/delivery';
import { useAuth } from '@/app/_providers/AuthProvider';
import LoginOverlay from '@/components/ui/LoginOverlay';
import SignupOverlay from '@/components/ui/SignupOverlay';
import { useMemo, useState } from 'react';
import { DeliveryNavbar } from '@/components/delivery/DeliveryNavbar';

export default function ProfilePage() {
  const { vehicle, toggleOnline, setVehicle } = useDeliveryState();
  const { isLoggedIn, user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // Safely read deliveries and COD cash from user
  const deliveries = (user as any)?.deliveries as Array<{ delivery_fee_cents?: number }> ?? [];
  const deliveriesCount = deliveries.length;
  const earningsCents = deliveries.reduce(
    (sum: number, d: { delivery_fee_cents?: number }) => sum + (d.delivery_fee_cents ?? 0),
    0
  );
  const earningsDisplay = `${earningsCents.toLocaleString()} MMK`;
  const cashCollectedCents = (user as any)?.cash_collected_cents ?? 0;
  const cashCollectedDisplay = `${cashCollectedCents.toLocaleString()} MMK`;
  // Map backend status strings ('available'|'unavailable'|'busy') to DriverStatus
  const backendToDriverStatus = (s: string | undefined): DriverStatus =>
    s === 'available' ? 'online' : s === 'busy' ? 'busy' : 'offline';
  const driverStatusToBackend = (s: DriverStatus) =>
    s === 'online' ? 'available' : s === 'busy' ? 'busy' : 'unavailable';

  const initialStatus = backendToDriverStatus((user as any)?.rider?.status);
  const [availability, setAvailability] = useState<DriverStatus>(initialStatus ?? 'offline');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Toggle status and persist to backend
  async function handleToggleStatus() {
    setStatusError(null);
    const nextDriverStatus: DriverStatus = availability === 'online' ? 'offline' : 'online';
    const nextStatusBackend = driverStatusToBackend(nextDriverStatus);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const riderId = (user as any)?.rider?.id;
    if (!riderId) {
      setStatusError('Profile not loaded. Try logging in again.');
      return;
    }

    setStatusLoading(true);
    try {
      const res = await fetch('http://localhost:8000/delivery/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ rider_id: riderId, status: nextStatusBackend }),
      });

      const bodyText = await res.text().catch(() => '');
      if (!res.ok) {
        let msg = 'Failed to update status.';
        try {
          const j = JSON.parse(bodyText);
          if (j?.detail) msg = typeof j.detail === 'string' ? j.detail : msg;
        } catch {
          if (bodyText) msg = bodyText.slice(0, 120);
        }
        setStatusError(msg);
        return;
      }

      const data = bodyText ? JSON.parse(bodyText) : {};
      if (data?.success && data?.status) {
        setAvailability(backendToDriverStatus(data.status));
        try {
          toggleOnline();
        } catch {
          // ignore
        }
      }
    } catch (err) {
      setStatusError(String(err));
    } finally {
      setStatusLoading(false);
    }
  }
    const licensePlate = (user as any)?.rider?.license_plate ?? 'N/A';
    const stats = [
      { icon: Package, label: 'Deliveries', value: String(deliveriesCount) },
      { icon: Truck, label: 'Vehicle Plate', value: licensePlate },
      { icon: DollarSign, label: 'Earnings', value: earningsDisplay },
      { icon: Banknote, label: 'Cash on delivery', value: cashCollectedDisplay },
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
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900">You’re logged out</h1>
          <p className="text-gray-500 mt-2">Log in or sign up to access your driver profile.</p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setShowLogin(true)}
              className="px-5 py-2.5 rounded-xl font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => setShowSignup(true)}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors"
            >
              Sign up
            </button>
          </div>
        </main>
      ) : (
        <>
          {/* Header */}
          <header className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <div className="max-w-2xl mx-auto px-4 pt-8 pb-10">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <User className="w-10 h-10 text-white/90" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold truncate">{displayName || 'Driver'}</h1>
                  <p className="text-gray-300 text-sm truncate mt-0.5">{displayEmail || '—'}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 -mt-2 pb-24 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 truncate" title={value}>{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Status */}
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Status</h2>
              <StatusToggle
                status={availability}
                onToggle={handleToggleStatus}
                disabled={statusLoading}
              />
              {statusError && (
                <p className="mt-2 text-sm text-red-600">{statusError}</p>
              )}
            </div>

            {/* Vehicle */}
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Vehicle</h2>
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
