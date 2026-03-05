import { useState } from 'react';
import {
  MapPin,
  Navigation2,
  Package,
  Check,
  Camera,
  MessageCircle,
  User,
  FileText,
  ChevronRight,
  Store,
  Clock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ActiveOrder } from '@/types/delivery';
import { Message } from '@/types/delivery';

interface ActiveOrderCardProps {
  order: ActiveOrder;
  messages: Message[];
  onArrivedAtShop: () => void;
  onPickedUp: () => void;
  onComplete: () => void;
  onSendMessage: (message: string) => void;
  onNavigateToDestination: (
    latitude: number,
    longitude: number,
    type: 'shop' | 'customer',
    startCoords?: { latitude: number; longitude: number }
  ) => void;
}

export function ActiveOrderCard({
  order,
  messages,
  onArrivedAtShop,
  onPickedUp,
  onComplete,
  onSendMessage,
  onNavigateToDestination,
}: ActiveOrderCardProps) {
  const [loadingNavigate, setLoadingNavigate] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [loadingArrived, setLoadingArrived] = useState(false);
  const [loadingPickup, setLoadingPickup] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);

  const isPickup = order.phase === 'pickup';
  const canPickup = order.isWithinPickupRange && order.arrivedAtShopAt;

  const handleNavigate = async () => {
    setLoadingNavigate(true);
    try {
      if (isPickup && order.shop.latitude && order.shop.longitude) {
        console.log("[ActiveOrderCard] Navigating to shop:", order.shop.latitude, order.shop.longitude);
        await Promise.resolve(onNavigateToDestination(order.shop.latitude, order.shop.longitude, 'shop'));
      } else if (!isPickup && order.customer.latitude && order.customer.longitude) {
        console.log("[ActiveOrderCard] Navigating to customer from restaurant:", order.customer.latitude, order.customer.longitude);
        const startCoords = order.shop.latitude && order.shop.longitude 
          ? { latitude: order.shop.latitude, longitude: order.shop.longitude }
          : undefined;
        await Promise.resolve(
          onNavigateToDestination(
            order.customer.latitude, 
            order.customer.longitude, 
            'customer',
            startCoords
          )
        );
      } else {
        console.log("[ActiveOrderCard] No valid coordinates for Mapbox, skipping navigation.");
      }
    } finally {
      setTimeout(() => setLoadingNavigate(false), 600);
    }
  };

  const handleCapturePOD = () => {
    // Removed Proof of Delivery functionality
  };

  // Removed ProofOfDelivery component rendering
  // if (showPOD) {
  //   return (
  //     <ProofOfDelivery
  //       onCapture={handleCapturePOD}
  //       onClose={() => setShowPOD(false)}
  //     />
  //   );
  // }

  return (
    <div className="space-y-4 animate-enter w-full">
      {/* Progress Stepper */}
      <div className="relative flex items-center justify-between px-8 py-6 rounded-3xl glass-card shadow-soft overflow-hidden">
        {/* Progress Line */}
        <div className="absolute left-8 right-8 top-1/2 h-1 bg-secondary -z-10 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-700 ease-out gradient-primary",
              isPickup ? "w-0" : "w-full"
            )}
          />
        </div>

        {/* Step 1: Shop */}
        <div className="flex flex-col items-center gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-xl">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-glow",
            isPickup
              ? "gradient-primary text-white scale-110 ring-4 ring-primary/20"
              : "bg-success text-white"
          )}>
            {isPickup ? <Store className="w-5 h-5" /> : <Check className="w-5 h-5" />}
          </div>
          <span className={cn("text-xs font-bold", isPickup ? "text-primary" : "text-success")}>Pickup</span>
        </div>

        {/* Step 2: Customer */}
        <div className="flex flex-col items-center gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-xl">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
            !isPickup
              ? "gradient-primary text-white scale-110 ring-4 ring-primary/20 shadow-glow"
              : "bg-secondary text-muted-foreground"
          )}>
            {order.pickedUpAt ? <Package className="w-5 h-5" /> : <Navigation2 className="w-5 h-5" />}
          </div>
          <span className={cn("text-xs font-bold", !isPickup ? "text-primary" : "text-muted-foreground")}>On the way</span>
        </div>
      </div>

      {/* Main Order Card */}
      <div className="rounded-3xl glass-card shadow-card border border-border/50 overflow-hidden">
        {/* Header Section */}
        <div className="p-5 border-b border-border/50 bg-gradient-to-br from-white/50 to-transparent">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {isPickup ? 'Pick up from' : 'Delivering to'}
              </p>
              <h2 className="text-xl font-bold text-foreground leading-tight">
                {isPickup ? order.shop.name : order.customer.name}
              </h2>
            </div>
            <div className={cn(
              "p-3 rounded-2xl shadow-sm",
              isPickup ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
            )}>
              {isPickup ? <Package className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-secondary/30 border border-border/50">
            <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-foreground font-medium leading-snug">
                {isPickup ? order.shop.address : order.customer.address}
              </p>
              {!isPickup && order.customer.notes && (
                <div className="flex items-start gap-1.5 text-sm text-amber-600 bg-amber-50 p-2 rounded-lg mt-2">
                  <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{order.customer.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-4">
          <div className="grid w-full">
            <Button
              variant="outline"
              className="h-12 rounded-xl border-primary/20 hover:bg-primary/5 text-primary"
              disabled={loadingNavigate}
              onClick={handleNavigate}
            >
              {loadingNavigate ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Navigation2 className="w-4 h-4 mr-2" />}
              Navigate
            </Button>
            {/* <Button
              variant="outline"
              className="h-12 rounded-xl border-border hover:bg-secondary"
              disabled={loadingMessage}
              onClick={async () => {
                setLoadingMessage(true);
                try {
                  await Promise.resolve(onSendMessage("I'm on my way!"));
                } finally {
                  setTimeout(() => setLoadingMessage(false), 600);
                }
              }}
            >
              {loadingMessage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageCircle className="w-4 h-4 mr-2" />}
              Message
            </Button> */}
          </div>

          {/* Pickup Items */}
          {isPickup && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Order Items</span>
              </div>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50">
                    <span className="font-medium">{item.name}</span>
                    <span className="bg-secondary px-2.5 py-1 rounded-lg text-sm font-bold min-w-[2rem] text-center">
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dropoff Actions */}
          {/* Removed "Evidence of Delivery" button as per user request */}

          {/* Primary Action Button */}
          <div className="pt-2">
            {isPickup ? (
              !order.arrivedAtShopAt ? (
                <Button
                  className="w-full h-14 text-lg font-bold rounded-2xl shadow-glow gradient-primary hover:opacity-90 transition-opacity"
                  disabled={loadingArrived}
                  onClick={async () => {
                    setLoadingArrived(true);
                    try {
                      await Promise.resolve(onArrivedAtShop());
                    } finally {
                      setTimeout(() => setLoadingArrived(false), 600);
                    }
                  }}
                >
                  {loadingArrived && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  I&apos;ve Arrived at Shop
                </Button>
              ) : (
                <Button
                  className="w-full h-14 text-lg font-bold rounded-2xl"
                  variant={canPickup ? 'default' : 'secondary'}
                  disabled={!canPickup || loadingPickup}
                  onClick={async () => {
                    setLoadingPickup(true);
                    try {
                      await Promise.resolve(onPickedUp());
                    } finally {
                      setTimeout(() => setLoadingPickup(false), 600);
                    }
                  }}
                >
                  {loadingPickup && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <span>{canPickup ? 'Confirm Pickup' : 'Move Closer to Pickup'}</span>
                </Button>
              )
            ) : (
              <Button
                className="w-full h-14 text-lg font-bold rounded-2xl shadow-glow gradient-success hover:opacity-90 transition-opacity"
                disabled={loadingComplete}
                onClick={async () => {
                  setLoadingComplete(true);
                  try {
                    await Promise.resolve(onComplete());
                  } finally {
                    setTimeout(() => setLoadingComplete(false), 600);
                  }
                }}
              >
                {loadingComplete && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <span>Complete Delivery</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
