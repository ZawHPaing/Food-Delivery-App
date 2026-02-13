import { useState, useCallback, useEffect } from 'react';
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
  // Initialize from localStorage directly to avoid state flash/reset
  const [status, setStatus] = useState<DriverStatus>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('driver_status') as DriverStatus) || 'offline';
    }
    return 'offline';
  });
  
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
    localStorage.setItem('driver_status', status);
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

  // Simulate incoming requests when online
  useEffect(() => {
    if (status === 'online' && !activeOrder) {
      setIncomingRequests(mockRequests);
    } else {
      setIncomingRequests([]);
    }
  }, [status, activeOrder]);

  const toggleOnline = useCallback(() => {
    setStatus((prev) => {
      if (prev === 'offline') {
        setShiftStartTime(new Date());
        return 'online';
      }
      // If busy (on delivery) but somehow lost the order, allow resetting to offline
      setShiftStartTime(null);
      setActiveOrder(null);
      localStorage.removeItem('driver_active_order');
      return 'offline';
    });
  }, []);

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
    setStatus('online');
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
  };
}
