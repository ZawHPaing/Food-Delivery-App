import { MapPin, Send, Navigation } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRestaurant } from '@/context/RestaurantContext';

interface RiderModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
}

export function RiderModal({ open, onClose, orderId }: RiderModalProps) {
  const { riders, sendRiderRequest, deliveries } = useRestaurant();
  
  // Check if there's already a pending delivery for this order
  const existingDelivery = deliveries.find(d => d.order_id === orderId);
  const hasActiveRequest = existingDelivery && existingDelivery.status === 'Requesting';

  // Sort riders by distance, available first
  const sortedRiders = [...riders]
    .sort((a, b) => {
      if (a.is_available !== b.is_available) {
        return a.is_available ? -1 : 1;
      }
      return a.distance_km - b.distance_km;
    });

  const handleSendRequest = (riderId: string) => {
    sendRiderRequest(orderId, riderId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-[#e4002b]" />
            Find Nearby Riders
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3">
            {sortedRiders.map((rider) => (
              <div 
                key={rider.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  rider.is_available 
                    ? 'border-border bg-card hover:bg-accent/50' 
                    : 'border-muted bg-muted/30 opacity-60'
                }`}
              >
                <img 
                  src={rider.photo} 
                  alt={rider.name}
                  className="h-12 w-12 rounded-full bg-muted"
                />
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-card-foreground truncate">
                    {rider.name}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{rider.distance_km.toFixed(1)} km away</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {rider.is_available ? (
                    <Button 
                      size="sm"
                      onClick={() => handleSendRequest(rider.id)}
                      disabled={hasActiveRequest}
                      className="bg-gradient-to-r from-[#e4002b] to-[#ff6600] border-none text-white"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Send Request
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground">
                      Busy
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {hasActiveRequest && (
          <p className="text-sm text-muted-foreground text-center py-2">
            A request is already pending for this order
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
