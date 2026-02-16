import { MapPin, Package, Navigation, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeliveryRequest } from '@/types/delivery';

interface IncomingRequestProps {
  request: DeliveryRequest;
  onAccept: () => void;
  onDecline: () => void;
  queuePosition: number;
}

export function IncomingRequest({
  request,
  onAccept,
  onDecline,
  queuePosition,
}: IncomingRequestProps) {
  const { shop, items, deliveryDistance, estimatedPickupTime, estimatedDeliveryTime } = request;

  // Format the time the request was received
  const receivedTime = new Date(request.createdAt || Date.now()).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="p-4 rounded-2xl bg-card shadow-card border border-border animate-scale-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl gradient-primary">
            <Package className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Queue #{queuePosition}</p>
            <h3 className="font-bold text-lg text-foreground">{shop.name}</h3>
          </div>
        </div>
        {/* Replaced CountdownTimer with static Sent Time */}
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sent At</p>
          <p className="text-sm font-medium text-foreground">{receivedTime}</p>
        </div>
      </div>

      {/* Shop distance */}
      <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-secondary/50">
        <Navigation className="w-4 h-4 text-primary" />
        <span className="text-sm text-foreground">
          <span className="font-semibold">{shop.distance} km</span> to shop
        </span>
        <span className="text-muted-foreground mx-2">•</span>
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">~{estimatedPickupTime} min</span>
      </div>

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
        <Button variant="muted" className="flex-1" onClick={onDecline}>
          Decline
        </Button>
        <Button className="flex-1" onClick={onAccept}>
          Accept Order
        </Button>
      </div>
    </div>
  );
}
