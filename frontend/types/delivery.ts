export type VehicleType = 'bike' | 'car' | 'scooter';

export type OrderPhase = 'pickup' | 'dropoff';

export type DriverStatus = 'online' | 'offline' | 'busy';

export interface Shop {
  id: string;
  name: string;
  address: string;
  distance: number; // in km
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  notes?: string;
  phone?: string;
}

export interface DeliveryRequest {
  id: string;
  requestId: string; // backend dispatch_requests.id for accept/decline
  shop: Shop;
  items: OrderItem[];
  customer: Customer;
  deliveryDistance: number; // in km
  estimatedPickupTime: number; // in minutes
  estimatedDeliveryTime: number; // in minutes
  expiresAt: Date;
  createdAt?: Date;
}

export interface ActiveOrder {
  id: string;
  phase: OrderPhase;
  shop: Shop;
  items: OrderItem[];
  customer: Customer;
  pickedUpAt?: Date;
  arrivedAtShopAt?: Date;
  isWithinPickupRange: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isDriver: boolean;
}
