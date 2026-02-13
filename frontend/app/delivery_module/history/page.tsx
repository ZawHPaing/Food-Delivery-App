"use client";

import { Package, MapPin, Clock, Check } from 'lucide-react';

const mockHistory = [
  {
    id: '1',
    shopName: 'Burger Palace',
    customerName: 'John Smith',
    items: 3,
    earnings: 8.50,
    completedAt: new Date(Date.now() - 3600000),
    distance: 3.2,
  },
  {
    id: '2',
    shopName: 'Pizza Heaven',
    customerName: 'Sarah Johnson',
    items: 2,
    earnings: 6.25,
    completedAt: new Date(Date.now() - 7200000),
    distance: 2.1,
  },
  {
    id: '3',
    shopName: 'Sushi Express',
    customerName: 'Mike Chen',
    items: 5,
    earnings: 12.00,
    completedAt: new Date(Date.now() - 10800000),
    distance: 4.5,
  },
  {
    id: '4',
    shopName: 'Taco Town',
    customerName: 'Emily Davis',
    items: 4,
    earnings: 7.75,
    completedAt: new Date(Date.now() - 86400000),
    distance: 2.8,
  },
];

export default function HistoryPage() {
  const todayEarnings = mockHistory
    .filter((h) => h.completedAt.getTime() > Date.now() - 86400000)
    .reduce((sum, h) => sum + h.earnings, 0);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-foreground">Delivery History</h1>
          <p className="text-base text-muted-foreground">Your completed deliveries</p>
        </div>
      </header>

      {/* Today's summary */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="p-6 rounded-2xl gradient-primary shadow-glow mb-6">
          <p className="text-primary-foreground/80 text-sm mb-1">Today's Earnings</p>
          <p className="text-4xl font-bold text-primary-foreground">
            ${todayEarnings.toFixed(2)}
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80">
                {mockHistory.filter((h) => h.completedAt.getTime() > Date.now() - 86400000).length} deliveries
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80">
                {mockHistory
                  .filter((h) => h.completedAt.getTime() > Date.now() - 86400000)
                  .reduce((sum, h) => sum + h.distance, 0)
                  .toFixed(1)} km
              </span>
            </div>
          </div>
        </div>

        {/* History list */}
        <div className="space-y-3">
          {mockHistory.map((order) => (
            <div
              key={order.id}
              className="p-4 rounded-xl bg-card shadow-card border border-border animate-fade-in"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{order.shopName}</p>
                    <p className="text-sm text-muted-foreground">to {order.customerName}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-success">+${order.earnings.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span>{order.items} items</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{order.distance} km</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {order.completedAt.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
