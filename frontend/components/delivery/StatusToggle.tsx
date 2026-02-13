import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { DriverStatus } from '@/types/delivery';
import { Wifi, WifiOff, Bike } from 'lucide-react';

interface StatusToggleProps {
  status: DriverStatus;
  onToggle: () => void;
  disabled?: boolean;
}

export function StatusToggle({ status, onToggle, disabled }: StatusToggleProps) {
  const isOnline = status === 'online' || status === 'busy';
  const isBusy = status === 'busy';

  return (
    <div className="flex items-center justify-between p-5 rounded-3xl glass-card shadow-soft hover:shadow-glow transition-all duration-300">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
            isOnline
              ? (isBusy ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success')
              : 'bg-muted text-muted-foreground'
          )}
        >
          {isBusy ? <Bike className="w-6 h-6 animate-pulse" /> : isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
        </div>
        <div>
          <h3 className="font-bold text-foreground text-lg">
            {isBusy ? 'On Delivery' : isOnline ? 'Available' : 'Unavailable'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isBusy
              ? 'Complete current order'
              : isOnline
                ? 'Waiting for requests...'
                : 'Turn on to start working'}
          </p>
        </div>
      </div>
      <Switch
        checked={isOnline}
        onCheckedChange={onToggle}
        disabled={disabled}
        className="data-[state=checked]:bg-success scale-125 mr-2"
      />
    </div>
  );
}
