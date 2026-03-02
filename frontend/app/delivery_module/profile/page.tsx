"use client";

import { useDeliveryContext } from '@/app/_providers/DeliveryProvider';
import { StatusToggle } from '@/components/delivery/StatusToggle';
import { VehicleSelector } from '@/components/delivery/VehicleSelector';
import { User, DollarSign, Package, Truck, Banknote, Clock, AlertCircle } from 'lucide-react';
import { DriverStatus, VehicleType } from '@/types/delivery';
import { useAuth } from '@/app/_providers/AuthProvider';
import LoginOverlay from '@/components/ui/LoginOverlay';
import SignupOverlay from '@/components/ui/SignupOverlay';
import { useMemo, useState, useEffect } from 'react';
import { DeliveryNavbar } from '@/components/delivery/DeliveryNavbar';

export default function ProfilePage() {
  const { vehicle, toggleOnline, setVehicle } = useDeliveryContext();
  const { isLoggedIn, user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Check for pending status
  useEffect(() => {
    if (user) {
      // Check if user_type exists in the user object
      if ('user_type' in user) {
        const userType = (user as any).user_type;
        setIsPending(userType === 'rider_pending');
      } else {
        // If user_type isn't in the user object, check the JWT token
        try {
          const token = localStorage.getItem('access_token');
          if (token) {
            // Decode JWT to get user_type
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const decoded = JSON.parse(jsonPayload);
            if (decoded.user_type === 'rider_pending') {
              setIsPending(true);
            }
          }
        } catch (e) {
          console.error('Error decoding token:', e);
        }
      }
    }
  }, [user]);

  // Safely read deliveries and COD cash from user
  const deliveries = (user as any)?.deliveries as Array<{ delivery_fee_cents?: number }> ?? [];
  const deliveriesCount = deliveries.length;
  const earningsCents = deliveries.reduce(
    (sum: number, d: { delivery_fee_cents?: number }) => sum + (d.delivery_fee_cents ?? 0),
    0
  );
  const earningsDisplay = `${(earningsCents / 100).toFixed(2)} USD`;
  const cashCollectedCents = (user as any)?.cash_collected_cents ?? 0;
  const cashCollectedDisplay = `${(cashCollectedCents / 100).toFixed(2)} USD`;
  
  // Map backend status strings to DriverStatus
  const backendToDriverStatus = (s: string | undefined): DriverStatus =>
    s === 'available' ? 'online' : s === 'busy' ? 'busy' : 'offline';

  const initialStatus = backendToDriverStatus((user as any)?.rider?.status);
  const [availability, setAvailability] = useState<DriverStatus>(initialStatus ?? 'offline');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Handle status toggle
  const handleToggleStatus = async () => {
    if (isPending) {
      setStatusError('Your account is pending approval. You cannot go online yet.');
      return;
    }
    await toggleOnline();
  };
  
  const licensePlate = (user as any)?.rider?.license_plate ?? 'N/A';
  const stats = [
    { icon: Package, label: 'Deliveries', value: String(deliveriesCount) },
    { icon: Truck, label: 'Vehicle Plate', value: licensePlate },
    { icon: DollarSign, label: 'Earnings', value: earningsDisplay },
    { icon: Banknote, label: 'Cash on delivery', value: cashCollectedDisplay },
  ];

  // Map registered vehicle from backend rider profile to UI vehicle type
  const registeredVehicle: VehicleType | null = useMemo(() => {
    const raw = (user as any)?.rider?.vehicle_type?.toLowerCase();
    if (!raw) return null;
    if (['car', 'van', 'truck', 'bus'].includes(raw)) return 'car';
    if (['bike', 'bicycle', 'motorbike', 'scooter'].includes(raw)) return 'bike';
    return null;
  }, [user]);

  const displayVehicle: VehicleType = registeredVehicle ?? vehicle;
  const allowedVehicleTypes: VehicleType[] = [displayVehicle];

  const handleVehicleChange = () => {
    // Vehicle type is fixed; no switching from this screen
  };

  // Display values directly from `user`
  const displayEmail = user?.email ?? '';
  const displayFirstName = (user as any)?.first_name ?? '';
  const displayLastName = (user as any)?.last_name ?? '';
  const displayName = `${displayFirstName} ${displayLastName}`.trim() || 'Driver';

  // Logout handler
  const handleLogout = () => {
    logout();
    setShowLogin(true);
  };

  return (
    <div className="min-h-screen pb-24 relative">
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
          {/* Pending Overlay */}
          {isPending && (
            <div 
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            >
              <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-amber-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
                  Account Pending Approval
                </h2>
                
                <p className="text-gray-600 text-center mb-6">
                  Your rider account is currently under review by our admin team. 
                  You'll be able to start accepting deliveries once your account is approved.
                </p>
                
                <div className="bg-amber-50 rounded-xl p-5 mb-6">
                  <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    What happens next?
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm text-amber-700">
                      <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">1</span>
                      <span>Admin will review your application within 24-48 hours</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-amber-700">
                      <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">2</span>
                      <span>You'll receive an email notification once approved</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-amber-700">
                      <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">3</span>
                      <span>After approval, you can go online and start earning</span>
                    </li>
                  </ul>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <header className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <div className="max-w-2xl mx-auto px-4 pt-8 pb-10">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <User className="w-10 h-10 text-white/90" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold truncate">{displayName}</h1>
                  <p className="text-gray-300 text-sm truncate mt-0.5">{displayEmail}</p>
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
                  className={`p-4 rounded-2xl bg-white border border-gray-100 shadow-sm text-center ${
                    isPending ? 'opacity-50' : ''
                  }`}
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
                disabled={statusLoading || isPending}
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