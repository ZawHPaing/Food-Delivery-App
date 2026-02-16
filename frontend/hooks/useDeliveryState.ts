import { useAuth } from '@/app/_providers/AuthProvider';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  DriverStatus, 
  VehicleType, 
  DeliveryRequest, 
  ActiveOrder,
  Message 
} from '@/types/delivery';

// Mock data for demonstration
const mockRequests: DeliveryRequest[] = [
  {
    id: '1',
    shop: {
      id: 's1',
      name: 'Burger Palace',
      address: '123 Main Street',
      distance: 1.2,
    },
    items: [
      { id: 'i1', name: 'Classic Burger', quantity: 2 },
      { id: 'i2', name: 'Large Fries', quantity: 1 },
      { id: 'i3', name: 'Coke', quantity: 2 },
    ],
    customer: {
      id: 'c1',
      name: 'John Smith',
      address: '456 Oak Avenue, Apt 3B',
      notes: 'Gate code: 1234. Leave at door.',
      phone: '+1 555-0123',
    },
    deliveryDistance: 2.5,
    estimatedPickupTime: 5,
    estimatedDeliveryTime: 12,
    expiresAt: new Date(Date.now() + 180000), // 3 minutes
  },
  {
    id: '2',
    shop: {
      id: 's2',
      name: 'Pizza Heaven',
      address: '789 Elm Road',
      distance: 0.8,
    },
    items: [
      { id: 'i4', name: 'Pepperoni Pizza (L)', quantity: 1 },
      { id: 'i5', name: 'Garlic Bread', quantity: 1 },
    ],
    customer: {
      id: 'c2',
      name: 'Sarah Johnson',
      address: '321 Pine Street',
      notes: 'Ring doorbell twice',
    },
    deliveryDistance: 1.8,
    estimatedPickupTime: 3,
    estimatedDeliveryTime: 8,
    expiresAt: new Date(Date.now() + 120000), // 2 minutes
  },
];

export function useDeliveryState() {
  const { user, updateProfile } = useAuth();
  
  // Use status from auth as the source of truth
  const initialHookStatus = useMemo(() => {
    const rawStatus = (user as any)?.rider?.status;
    if (rawStatus === 'available') return 'available';
    if (rawStatus === 'busy') return 'busy';
    return 'unavailable';
  }, [user]);

  const [status, setStatus] = useState<DriverStatus>(initialHookStatus);

  useEffect(() => {
    setStatus(initialHookStatus);
  }, [initialHookStatus]);

  const updateStatus = useCallback(async (nextStatus: DriverStatus) => {
    const riderId = (user as any)?.rider?.id;
    if (!riderId) {
      console.error('No rider ID available to update status');
      return;
    }

    const backendStatus = nextStatus === 'available' ? 'available' : 'unavailable';
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    try {
      const res = await fetch(`http://localhost:8000/delivery/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rider_id: riderId,
          status: backendStatus,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Update local hook state
          setStatus(nextStatus);
          // Update global auth state
          updateProfile({
            rider: {
              ...(user as any)?.rider,
              status: backendStatus
            }
          });
        }
      } else {
        console.error('Failed to update status on backend');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  }, [user, updateProfile]);
  
  const [vehicle, setVehicle] = useState<VehicleType>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('driver_vehicle') as VehicleType) || 'bike';
    }
    return 'bike';
  });

  const [shiftStartTime, setShiftStartTime] = useState<Date | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('driver_shift_start');
      return saved ? new Date(saved) : null;
    }
    return null;
  });

  const [incomingRequests, setIncomingRequests] = useState<DeliveryRequest[]>([]);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('driver_active_order');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Convert date strings back to Date objects if they exist
          if (parsed.arrivedAtShopAt) parsed.arrivedAtShopAt = new Date(parsed.arrivedAtShopAt);
          if (parsed.pickedUpAt) parsed.pickedUpAt = new Date(parsed.pickedUpAt);
          return parsed;
        } catch (e) {
          console.error('Failed to parse active order from localStorage', e);
          return null;
        }
      }
    }
    return null;
  });
  const [messages, setMessages] = useState<Message[]>([]);



  // Persist state to localStorage whenever it changes
  useEffect(() => {

    localStorage.setItem('driver_vehicle', vehicle);
    if (shiftStartTime) {
      localStorage.setItem('driver_shift_start', shiftStartTime.toISOString());
    } else {
      localStorage.removeItem('driver_shift_start');
    }
    
    if (activeOrder) {
      localStorage.setItem('driver_active_order', JSON.stringify(activeOrder));
    } else {
      localStorage.removeItem('driver_active_order');
    }
  }, [status, vehicle, shiftStartTime, activeOrder]);

  // Simulate incoming requests when available
  useEffect(() => {
    if (status === 'available' && !activeOrder) {
      setIncomingRequests(mockRequests);
    } else {
      setIncomingRequests([]);
    }
  }, [status, activeOrder]);

  const toggleDriverStatusOnBackend = useCallback(async (newStatus: DriverStatus): Promise<DriverStatus> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(newStatus);
      }, 300);
    });
  }, []);

  const toggleOnline = useCallback(() => {
    setStatus((prev) => {
      const newStatus = prev === 'unavailable' ? 'available' : 'unavailable';
      toggleDriverStatusOnBackend(newStatus).then((updatedStatus) => {
        if (updatedStatus === 'available') {
          setShiftStartTime(new Date());
        } else {
          setShiftStartTime(null);
          setActiveOrder(null);
          localStorage.removeItem('driver_active_order');
        }
        setStatus(updatedStatus);
      });
      return prev; // Return previous status until backend confirms
    });
  }, [toggleDriverStatusOnBackend]);

  const acceptOrder = useCallback((request: DeliveryRequest) => {
    setActiveOrder({
      id: request.id,
      phase: 'pickup',
      shop: request.shop,
      items: request.items,
      customer: request.customer,
      isWithinPickupRange: false,
    });
    setStatus('busy');
    setIncomingRequests([]);
  }, []);

  const declineOrder = useCallback((requestId: string) => {
    setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
  }, []);

  const arrivedAtShop = useCallback(() => {
    if (activeOrder) {
      setActiveOrder({
        ...activeOrder,
        arrivedAtShopAt: new Date(),
        isWithinPickupRange: true,
      });
    }
  }, [activeOrder]);

  const pickupOrder = useCallback(() => {
    if (activeOrder) {
      setActiveOrder({
        ...activeOrder,
        phase: 'dropoff',
        pickedUpAt: new Date(),
      });
    }
  }, [activeOrder]);

  const completeOrder = useCallback(() => {
    setActiveOrder(null);
    setMessages([]);
    setStatus('available');
  }, []);

  const sendMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'driver',
      content,
      timestamp: new Date(),
      isDriver: true,
    };
    setMessages((prev) => [...prev, newMessage]);
    
    // Simulate customer response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          senderId: 'customer',
          content: 'Thanks for the update!',
          timestamp: new Date(),
          isDriver: false,
        },
      ]);
    }, 2000);
  }, []);

  // Simulate being within pickup range after 5 seconds
  useEffect(() => {
    if (activeOrder?.phase === 'pickup' && activeOrder.arrivedAtShopAt && !activeOrder.isWithinPickupRange) {
      const timer = setTimeout(() => {
        setActiveOrder((prev) => prev ? { ...prev, isWithinPickupRange: true } : null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeOrder]);

  return {
    status,
    vehicle,
    shiftStartTime,
    incomingRequests,
    activeOrder,
    messages,
    setVehicle,
    toggleOnline,
    acceptOrder,
    declineOrder,
    arrivedAtShop,
    pickupOrder,
    completeOrder,
    sendMessage,
    updateStatus,
  };
}
