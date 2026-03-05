import { MapPin, Package, Navigation, Clock, User, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DeliveryRequest } from '@/types/delivery';

interface IncomingRequestProps {
  request: DeliveryRequest;
  onAccept: () => void;
  onDecline: () => void;
  queuePosition: number;
  riderLocation?: { latitude: number; longitude: number } | null;
}

export function IncomingRequest({
  request,
  onAccept,
  onDecline,
  queuePosition,
  riderLocation,
}: IncomingRequestProps) {
  const { shop, items, customer, deliveryDistance, estimatedPickupTime, estimatedDeliveryTime } = request;
  const [dynamicDistance, setDynamicDistance] = useState<number | null>(null);
  const [dynamicTime, setDynamicTime] = useState<number | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [autoDeclined, setAutoDeclined] = useState(false);

  const receivedTime = new Date(request.createdAt || Date.now()).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  useEffect(() => {
    if (riderLocation && shop.latitude && shop.longitude) {
      const getRouteInfo = async () => {
        try {
          const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${riderLocation.longitude},${riderLocation.latitude};${shop.longitude},${shop.latitude}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`,
            { method: 'GET' }
          );
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            setDynamicDistance(route.distance / 1000); // distance in km
            setDynamicTime(route.duration / 60); // duration in minutes
          }
        } catch (error) {
          console.error("Error fetching route info:", error);
        }
      };
      getRouteInfo();
    }
  }, [riderLocation, shop.latitude, shop.longitude]);

  useEffect(() => {
    if (!request.expiresAt || autoDeclined) return;
    const tick = () => {
      const ms = new Date(request.expiresAt).getTime() - Date.now();
      setRemainingMs(ms > 0 ? ms : 0);
      if (ms <= 0 && !autoDeclined) {
        setAutoDeclined(true);
        onDecline();
      }
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [request.expiresAt, autoDeclined, onDecline]);

  const formatRemaining = () => {
    if (remainingMs == null) return '';
    const total = Math.max(0, Math.floor(remainingMs / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div 
      className="p-4 rounded-2xl bg-card shadow-card border border-border animate-scale-in"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl gradient-primary">
            <Package className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Queue #{queuePosition}</p>
            <h3 className="font-bold text-lg text-foreground">{shop.name}</h3>
            {/* {shop.latitude && shop.longitude && (
              <p className="text-xs text-muted-foreground">
                Lat: {shop.latitude.toFixed(4)}, Lng: {shop.longitude.toFixed(4)}
              </p>
            )} */}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Expires In</p>
          <p className="text-sm font-medium text-foreground">{formatRemaining()}</p>
        </div>
      </div>

      {/* Shop distance */}
      <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-secondary/50">
        <Navigation className="w-4 h-4 text-primary" />
        <span className="text-sm text-foreground">
          <span className="font-semibold">
            {dynamicDistance !== null ? `${dynamicDistance.toFixed(2)} km` : `${shop.distance} km`}
          </span> to shop
        </span>
        <span className="text-muted-foreground mx-2">•</span>
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          ~{dynamicTime !== null ? `${dynamicTime.toFixed(0)} min` : `${estimatedPickupTime} min`}
        </span>
      </div>

      {/* Customer Info */}
      {/* <div className="mb-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">{customer.name}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {customer.address}
            </p>
            {customer.latitude && customer.longitude && (
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                Lat: {customer.latitude.toFixed(4)}, Lng: {customer.longitude.toFixed(4)}
              </p>
            )}
          </div>
        </div>
      </div> */}

      {/* Items */}
      <div className="mb-3">
        <p className="text-sm font-medium text-muted-foreground mb-2">Items ({items.length})</p>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item.id}
              className="px-3 py-1.5 text-sm bg-secondary rounded-lg text-foreground"
            >
              {item.quantity}× {item.name}
            </span>
          ))}
        </div>
      </div>

      {/* Delivery distance */}
      <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-success/10 border border-success/20">
        <MapPin className="w-4 h-4 text-success" />
        <span className="text-sm text-foreground">
          Delivery: <span className="font-semibold">{deliveryDistance} km</span>
        </span>
        <span className="text-muted-foreground mx-2">•</span>
        <span className="text-sm text-muted-foreground">~{estimatedDeliveryTime} min total</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="muted"
          className="flex-1 cursor-pointer"
          disabled={isDeclining || isAccepting}
          onClick={async () => {
            setIsDeclining(true);
            try {
              await Promise.resolve(onDecline());
            } finally {
              setTimeout(() => setIsDeclining(false), 600);
            }
          }}
        >
          {isDeclining && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Decline</span>
        </Button>
        <Button
          className="flex-1 cursor-pointer"
          disabled={isAccepting || isDeclining}
          onClick={async () => {
            setIsAccepting(true);
            try {
              await Promise.resolve(onAccept());
            } finally {
              setTimeout(() => setIsAccepting(false), 600);
            }
          }}
        >
          {isAccepting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Accept Order</span>
        </Button>
      </div>
    </div>
  );
}
