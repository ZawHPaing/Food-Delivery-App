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
    <div className="flex items-center justify-between p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
            isOnline
              ? (isBusy ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')
              : 'bg-gray-100 text-gray-500'
          )}
        >
          {isBusy ? <Bike className="w-6 h-6 animate-pulse" /> : isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-base">
            {isBusy ? 'On delivery' : isOnline ? 'Available' : 'Unavailable'}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {isBusy ? 'Complete current order' : isOnline ? 'Waiting for requests' : 'Turn on to start working'}
          </p>
        </div>
      </div>
      <Switch
        checked={isOnline}
        onCheckedChange={onToggle}
        disabled={disabled}
        className="data-[state=checked]:bg-emerald-600 scale-110"
      />
    </div>
  );
}
