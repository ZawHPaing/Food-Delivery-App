"use client";

import { ClipboardList } from 'lucide-react';
import { OrderCard } from '@/components/restaurant/orders/OrderCard';
import { useRestaurant } from '@/context/RestaurantContext';

export default function Orders() {
  const { orders } = useRestaurant();
  
  // Filter to show only 'Paid' orders for dispatch
  const paidOrders = orders.filter(o => o.status === 'Paid');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
             <ClipboardList className="h-8 w-8 text-[#e4002b]" />
             Order Management
           </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Track and dispatch incoming orders in real-time.
          </p>
        </div>
      </div>

      {paidOrders.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No paid orders waiting for dispatch</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paidOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
