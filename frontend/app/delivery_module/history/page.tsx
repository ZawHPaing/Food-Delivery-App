"use client";

import { useEffect, useState } from "react";
import { Package, MapPin, Clock, Check } from "lucide-react";

interface Delivery {
  id: number;
  restaurant_name: string;
  customer_name: string;
  earnings_cents: number;
  delivered_at: string;
  distance_km: number;
}

export default function HistoryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`http://localhost:8000/delivery/history?rider_id=8`);
        const data = await res.json();
        setDeliveries(data.deliveries);
      } catch (err) {
        console.error("Failed to fetch delivery history", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const todayDeliveries = deliveries.filter(
    (d) => new Date(d.delivered_at).getTime() > Date.now() - 86400000
  );
  const todayEarnings = todayDeliveries.reduce((sum, d) => sum + d.earnings_cents / 100, 0);
  const todayDistance = todayDeliveries.reduce((sum, d) => sum + d.distance_km, 0);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

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
          <p className="text-4xl font-bold text-primary-foreground">{todayDeliveries.reduce((sum, d) => sum + d.earnings_cents, 0)} MMK</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80">{todayDeliveries.length} deliveries</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80">{todayDistance.toFixed(1)} km</span>
            </div>
          </div>
        </div>

        {/* History list */}
        <div className="space-y-3">
          {deliveries.map((order) => (
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
                    <p className="font-semibold text-foreground">{order.restaurant_name}</p>
                    <p className="text-sm text-muted-foreground">to {order.customer_name}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-success">+{order.earnings_cents} MMK</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span>{order.distance_km.toFixed(1)} km</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(order.delivered_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
