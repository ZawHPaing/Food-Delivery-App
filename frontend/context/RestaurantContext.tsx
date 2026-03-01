"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem, Order, OrderItem, Delivery, Rider, TrackingPoint } from '@/types/admin_restaurant';

// Mock Data
const mockMenuItems: MenuItem[] = [
  { id: 'm1', name: 'Margherita Pizza', description: 'Classic tomato and mozzarella', price_cents: 1299, is_available: true },
  { id: 'm2', name: 'Pepperoni Pizza', description: 'Spicy pepperoni with cheese', price_cents: 1499, is_available: true },
  { id: 'm3', name: 'Caesar Salad', description: 'Fresh romaine with caesar dressing', price_cents: 899, is_available: true },
  { id: 'm4', name: 'Garlic Bread', description: 'Crispy bread with garlic butter', price_cents: 499, is_available: false },
  { id: 'm5', name: 'Tiramisu', description: 'Classic Italian dessert', price_cents: 699, is_available: true },
  { id: 'm6', name: 'Spaghetti Carbonara', description: 'Creamy pasta with bacon', price_cents: 1399, is_available: true },
];

const mockOrders: Order[] = [
  { id: 'o1', total_cents: 2798, status: 'Paid', created_at: '2024-01-22T10:30:00Z' },
  { id: 'o2', total_cents: 1998, status: 'Paid', created_at: '2024-01-22T10:45:00Z' },
  { id: 'o3', total_cents: 3297, status: 'Paid', created_at: '2024-01-22T11:00:00Z' },
  { id: 'o4', total_cents: 1499, status: 'Preparing', created_at: '2024-01-22T11:15:00Z' },
];

const mockOrderItems: OrderItem[] = [
  { id: 'oi1', order_id: 'o1', menu_item_id: 'm1', quantity: 1, price_cents: 1299 },
  { id: 'oi2', order_id: 'o1', menu_item_id: 'm3', quantity: 1, price_cents: 899 },
  { id: 'oi3', order_id: 'o1', menu_item_id: 'm5', quantity: 1, price_cents: 699 },
  { id: 'oi4', order_id: 'o2', menu_item_id: 'm2', quantity: 1, price_cents: 1499 },
  { id: 'oi5', order_id: 'o2', menu_item_id: 'm4', quantity: 1, price_cents: 499 },
  { id: 'oi6', order_id: 'o3', menu_item_id: 'm6', quantity: 2, price_cents: 2798 },
  { id: 'oi7', order_id: 'o3', menu_item_id: 'm4', quantity: 1, price_cents: 499 },
  { id: 'oi8', order_id: 'o4', menu_item_id: 'm2', quantity: 1, price_cents: 1499 },
];

const mockRiders: Rider[] = [
  { id: 'r1', name: 'Alex Johnson', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', distance_km: 0.5, is_available: true },
  { id: 'r2', name: 'Maria Garcia', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', distance_km: 1.2, is_available: true },
  { id: 'r3', name: 'James Wilson', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', distance_km: 2.1, is_available: true },
  { id: 'r4', name: 'Sarah Chen', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', distance_km: 0.8, is_available: false },
  { id: 'r5', name: 'Mike Brown', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', distance_km: 1.5, is_available: true },
];

const mockDeliveries: Delivery[] = [];

const mockTrackingPoints: TrackingPoint[] = [];

interface RestaurantContextType {
  menuItems: MenuItem[];
  orders: Order[];
  orderItems: OrderItem[];
  deliveries: Delivery[];
  riders: Rider[];
  trackingPoints: TrackingPoint[];
  updateMenuItemAvailability: (id: string, is_available: boolean) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, item: Omit<MenuItem, 'id'>) => void;
  deleteMenuItem: (id: string) => void;
  sendRiderRequest: (orderId: string, riderId: string) => void;
  rejectDelivery: (deliveryId: string) => void;
  acceptDelivery: (deliveryId: string) => void;
  confirmHandover: (deliveryId: string) => void;
  getOrderItems: (orderId: string) => (OrderItem & { menuItem: MenuItem | undefined })[];
  getDeliveryForOrder: (orderId: string) => Delivery | undefined;
  getRiderById: (riderId: string) => Rider | undefined;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [orders] = useState<Order[]>(mockOrders);
  const [orderItems] = useState<OrderItem[]>(mockOrderItems);
  const [deliveries, setDeliveries] = useState<Delivery[]>(mockDeliveries);
  const [riders, setRiders] = useState<Rider[]>(mockRiders);
  const [trackingPoints, setTrackingPoints] = useState<TrackingPoint[]>(mockTrackingPoints);

  const updateMenuItemAvailability = (id: string, is_available: boolean) => {
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, is_available } : item
    ));
  };

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: `m${Date.now()}`,
    };
    setMenuItems(prev => [...prev, newItem]);
  };

  const updateMenuItem = (id: string, item: Omit<MenuItem, 'id'>) => {
    setMenuItems(prev => prev.map(menuItem => 
      menuItem.id === id ? { ...menuItem, ...item } : menuItem
    ));
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id));
  };

  const sendRiderRequest = (orderId: string, riderId: string) => {
    const existingDelivery = deliveries.find(d => d.order_id === orderId);
    if (existingDelivery) {
      setDeliveries(prev => prev.map(d => 
        d.order_id === orderId ? { ...d, rider_id: riderId, status: 'Requesting' } : d
      ));
    } else {
      const newDelivery: Delivery = {
        id: `d${Date.now()}`,
        order_id: orderId,
        rider_id: riderId,
        status: 'Requesting',
        picked_up_at: null,
      };
      setDeliveries(prev => [...prev, newDelivery]);
    }
    
    // Update rider availability
    setRiders(prev => prev.map(r => 
      r.id === riderId ? { ...r, is_available: false } : r
    ));
  };

  const rejectDelivery = (deliveryId: string) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (delivery?.rider_id) {
      setRiders(prev => prev.map(r => 
        r.id === delivery.rider_id ? { ...r, is_available: true } : r
      ));
    }
    setDeliveries(prev => prev.filter(d => d.id !== deliveryId));
  };

  const acceptDelivery = (deliveryId: string) => {
    setDeliveries(prev => prev.map(d => 
      d.id === deliveryId ? { ...d, status: 'Accepted' } : d
    ));
    
    // Simulate tracking points for accepted delivery
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (delivery) {
      const newTrackingPoints: TrackingPoint[] = [
        { id: `tp${Date.now()}`, delivery_id: deliveryId, latitude: 40.7128, longitude: -74.0060, timestamp: new Date().toISOString() },
      ];
      setTrackingPoints(prev => [...prev, ...newTrackingPoints]);
    }
  };

  const confirmHandover = (deliveryId: string) => {
    setDeliveries(prev => prev.map(d => 
      d.id === deliveryId ? { ...d, status: 'Picked Up', picked_up_at: new Date().toISOString() } : d
    ));
  };

  const getOrderItems = (orderId: string) => {
    return orderItems
      .filter(oi => oi.order_id === orderId)
      .map(oi => ({
        ...oi,
        menuItem: menuItems.find(m => m.id === oi.menu_item_id)
      }));
  };

  const getDeliveryForOrder = (orderId: string) => {
    return deliveries.find(d => d.order_id === orderId);
  };

  const getRiderById = (riderId: string) => {
    return riders.find(r => r.id === riderId);
  };

  return (
    <RestaurantContext.Provider value={{
      menuItems,
      orders,
      orderItems,
      deliveries,
      riders,
      trackingPoints,
      updateMenuItemAvailability,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      sendRiderRequest,
      rejectDelivery,
      acceptDelivery,
      confirmHandover,
      getOrderItems,
      getDeliveryForOrder,
      getRiderById,
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
