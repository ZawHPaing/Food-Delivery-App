import { useState } from 'react';
import { MapPin, User, Clock, Package, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRestaurant } from '@/context/RestaurantContext';
import { Order } from '@/types/restaurant';
import { RiderModal } from './RiderModal';
import { RiderTrackingCard } from './RiderTrackingCard';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const [showRiderModal, setShowRiderModal] = useState(false);
  const { getOrderItems, getDeliveryForOrder, getRiderById, confirmHandover, rejectDelivery, acceptDelivery } = useRestaurant();

  const items = getOrderItems(order.id);
  const delivery = getDeliveryForOrder(order.id);
  const rider = delivery?.rider_id ? getRiderById(delivery.rider_id) : undefined;

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatTime = (date: string) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // If rider has accepted, show tracking view
  if (delivery && (delivery.status === 'Accepted' || delivery.status === 'Picked Up')) {
    return (
      <RiderTrackingCard
        order={order}
        delivery={delivery}
        rider={rider!}
        onConfirmHandover={() => confirmHandover(delivery.id)}
      />
    );
  }

  return (
    <>
      <Card className="border-border bg-card shadow-card hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-card-foreground">
              Order #{order.id.toUpperCase()}
            </CardTitle>
            <Badge variant="secondary" className="bg-[#e4002b]/10 text-[#e4002b] border-none">
              {order.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(order.created_at)}
            </span>
            <span className="font-medium text-foreground">
              {formatPrice(order.total_cents)}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Order Items */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-card-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Items
            </h4>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id} className="text-sm text-muted-foreground flex justify-between">
                  <span>{item.quantity}x {item.menuItem?.name || 'Unknown Item'}</span>
                  <span>{formatPrice(item.price_cents)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery Status */}
          {delivery && delivery.status === 'Requesting' && rider && (
            <div className="p-3 rounded-lg bg-accent/50 border border-accent">
              <div className="flex items-center gap-3">
                <img
                  src={rider.photo}
                  alt={rider.name}
                  className="h-10 w-10 rounded-full bg-muted"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-accent-foreground">{rider.name}</p>
                  <p className="text-xs text-muted-foreground">Request Pending...</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectDelivery(delivery.id)}
                    className="h-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => acceptDelivery(delivery.id)}
                    className="h-8 bg-[#ff6600] hover:bg-[#e65c00] text-white"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {!delivery && order.status === 'Paid' && (
            <Button
              className="w-full bg-gradient-to-r from-[#e4002b] to-[#ff6600] hover:shadow-lg text-white border-none"
              onClick={() => setShowRiderModal(true)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Find Nearby Riders
            </Button>
          )}
        </CardContent>
      </Card>

      <RiderModal
        open={showRiderModal}
        onClose={() => setShowRiderModal(false)}
        orderId={order.id}
      />
    </>
  );
}
