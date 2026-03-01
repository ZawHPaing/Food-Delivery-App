import { useEffect, useState } from 'react';
import { MapPin, User, Clock, CheckCircle, Navigation, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Order, Delivery, Rider } from '@/types/admin_restaurant';
import { useRestaurant } from '@/context/RestaurantContext';

interface RiderTrackingCardProps {
  order: Order;
  delivery: Delivery;
  rider: Rider;
  onConfirmHandover: () => void;
}

export function RiderTrackingCard({ order, delivery, rider, onConfirmHandover }: RiderTrackingCardProps) {
  const { getOrderItems } = useRestaurant();
  const items = getOrderItems(order.id);
  const [riderPosition, setRiderPosition] = useState({ lat: 40.7128, lng: -74.0060 });
  const [eta, setEta] = useState(5);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // Simulate rider movement
  useEffect(() => {
    if (delivery.status === 'Accepted') {
      const interval = setInterval(() => {
        setRiderPosition(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.001,
          lng: prev.lng + (Math.random() - 0.5) * 0.001,
        }));
        setEta(prev => Math.max(1, prev - 1));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [delivery.status]);

  return (
    <Card className="border-[#e4002b]/20 bg-card overflow-hidden shadow-card hover:shadow-lg transition-all duration-300">
      {/* Map placeholder */}
      <div className="h-40 bg-gradient-to-br from-[#e4002b]/10 to-[#ff6600]/20 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Restaurant marker */}
            <div className="absolute -left-8 top-0 flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-[#e4002b] flex items-center justify-center shadow-lg">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs mt-1 text-muted-foreground">Restaurant</span>
            </div>
            
            {/* Rider marker */}
            <div 
              className="absolute flex flex-col items-center transition-all duration-1000"
              style={{ 
                left: `${(riderPosition.lng + 74.0060) * 5000}px`,
                top: `${(riderPosition.lat - 40.7128) * 5000}px`
              }}
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#e4002b] to-[#ff6600] flex items-center justify-center shadow-lg animate-pulse">
                <Navigation className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        {/* ETA Badge */}
        {delivery.status === 'Accepted' && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-background/90 text-foreground shadow-md">
              <Clock className="h-3 w-3 mr-1" />
              ETA: {eta} min
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-card-foreground">
            Order #{order.id.toUpperCase()}
          </CardTitle>
          <Badge 
            variant="secondary" 
            className={delivery.status === 'Picked Up' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
              : 'bg-[#e4002b]/10 text-[#e4002b] border-none'
            }
          >
            {delivery.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {delivery.status === 'Accepted' && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#e4002b] to-[#ff6600] rounded-full animate-progress-grow" />
            </div>
            <Badge variant="outline" className="text-[#e4002b] border-[#e4002b]/20 bg-[#e4002b]/5">
              On the way
            </Badge>
          </div>
        )}
        {/* Rider Info */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-accent/50">
          <img 
            src={rider.photo} 
            alt={rider.name}
            className="h-12 w-12 rounded-full bg-muted border-2 border-[#e4002b]"
          />
          <div className="flex-1">
            <p className="font-medium text-accent-foreground">{rider.name}</p>
            <p className="text-sm text-muted-foreground">
              {delivery.status === 'Picked Up' ? 'Order handed over' : 'En route to pickup'}
            </p>
          </div>
          <Button size="icon" variant="outline" className="rounded-full">
            <Phone className="h-4 w-4" />
          </Button>
        </div>

        {/* Order Items Summary */}
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{items.length} items</span>
          <span className="mx-2">•</span>
          <span>{formatPrice(order.total_cents)}</span>
        </div>

        {/* Confirm Handover Button */}
        {delivery.status === 'Accepted' && (
          <Button 
            className="w-full bg-gradient-to-r from-[#e4002b] to-[#ff6600] hover:shadow-lg text-white border-none" 
            size="lg"
            onClick={onConfirmHandover}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Confirm Handover
          </Button>
        )}

        {delivery.status === 'Picked Up' && delivery.picked_up_at && (
          <div className="text-center py-2 text-sm text-muted-foreground">
            <CheckCircle className="h-5 w-5 text-green-500 inline mr-2" />
            Handed over at {new Date(delivery.picked_up_at).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
