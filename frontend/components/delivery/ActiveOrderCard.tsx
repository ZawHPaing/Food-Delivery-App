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
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ActiveOrder } from '@/types/delivery';
import { ProofOfDelivery } from './ProofOfDelivery';
import { Message } from '@/types/delivery';

interface ActiveOrderCardProps {
  order: ActiveOrder;
  messages: Message[];
  onArrivedAtShop: () => void;
  onPickedUp: () => void;
  onComplete: () => void;
  onSendMessage: (message: string) => void;
}

export function ActiveOrderCard({
  order,
  messages,
  onArrivedAtShop,
  onPickedUp,
  onComplete,
  onSendMessage,
}: ActiveOrderCardProps) {
  const [showPOD, setShowPOD] = useState(false);
  const [podCaptured, setPodCaptured] = useState(false);

  const isPickup = order.phase === 'pickup';
  const canPickup = order.isWithinPickupRange && order.arrivedAtShopAt;

  const handleNavigate = () => {
    const address = isPickup ? order.shop.address : order.customer.address;
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
  };

  const handleCapturePOD = () => {
    setPodCaptured(true);
    setShowPOD(false);
  };

  if (showPOD) {
    return (
      <ProofOfDelivery
        onCapture={handleCapturePOD}
        onClose={() => setShowPOD(false)}
      />
    );
  }

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
            <User className="w-5 h-5" />
          </div>
          <span className={cn("text-xs font-bold", !isPickup ? "text-primary" : "text-muted-foreground")}>Dropoff</span>
        </div>
      </div>

      {/* Main Order Card */}
      <div className="rounded-3xl glass-card shadow-card border border-border/50 overflow-hidden">
        {/* Header Section */}
        <div className="p-5 border-b border-border/50 bg-gradient-to-br from-white/50 to-transparent">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {isPickup ? 'Pick up from' : 'Deliver to'}
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
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-xl border-primary/20 hover:bg-primary/5 text-primary"
              onClick={handleNavigate}
            >
              <Navigation2 className="w-4 h-4 mr-2" />
              Navigate
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-xl border-border hover:bg-secondary"
              onClick={() => onSendMessage("I'm on my way!")}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
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
          {!isPickup && (
            <button
              onClick={() => setShowPOD(true)}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border-2',
                podCaptured
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-background border-dashed border-border hover:border-primary/50 hover:bg-primary/5'
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                podCaptured ? "bg-success text-white" : "bg-secondary text-muted-foreground"
              )}>
                {podCaptured ? <Check className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-base">
                  {podCaptured ? 'Proof Captured' : 'Evidence of Delivery'}
                </p>
                <p className="text-xs opacity-70">
                  {podCaptured ? 'Ready to complete' : 'Required to finish'}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 opacity-50" />
            </button>
          )}

          {/* Primary Action Button */}
          <div className="pt-2">
            {isPickup ? (
              !order.arrivedAtShopAt ? (
                <Button className="w-full h-14 text-lg font-bold rounded-2xl shadow-glow gradient-primary hover:opacity-90 transition-opacity" onClick={onArrivedAtShop}>
                  I've Arrived at Shop
                </Button>
              ) : (
                <Button
                  className="w-full h-14 text-lg font-bold rounded-2xl"
                  variant={canPickup ? 'default' : 'secondary'}
                  disabled={!canPickup}
                  onClick={onPickedUp}
                >
                  {canPickup ? 'Confirm Pickup' : 'Move Closer to Pickup'}
                </Button>
              )
            ) : (
              <Button
                className="w-full h-14 text-lg font-bold rounded-2xl shadow-glow gradient-success hover:opacity-90 transition-opacity"
                onClick={onComplete}
                disabled={!podCaptured}
              >
                Complete Delivery
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
