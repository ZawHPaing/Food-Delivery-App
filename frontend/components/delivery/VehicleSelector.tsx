import { Bike, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VehicleType } from '@/types/delivery';

interface VehicleSelectorProps {
  selected: VehicleType;
  onChange: (vehicle: VehicleType) => void;
  allowedTypes?: VehicleType[];
}

const vehicles = [
  { type: 'bike' as VehicleType, icon: Bike, label: 'Bike/Scooter', speed: 'Fastest in traffic' },
  { type: 'car' as VehicleType, icon: Car, label: 'Car/Bus', speed: 'Large orders' },
];

export function VehicleSelector({ selected, onChange, allowedTypes }: VehicleSelectorProps) {
  const visibleVehicles = allowedTypes
    ? vehicles.filter((v) => allowedTypes.includes(v.type))
    : vehicles;
  const isSingle = visibleVehicles.length === 1;

  return (
    <div className="p-4 rounded-xl bg-card shadow-card">

      <div className={cn('grid gap-2', isSingle ? 'grid-cols-1' : 'grid-cols-2')}>
        {visibleVehicles.map(({ type, icon: Icon, label, speed }) => (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200',
              selected === type
                ? 'bg-primary/15 border-2 border-primary shadow-glow'
                : 'bg-secondary/50 border-2 border-transparent hover:bg-secondary'
            )}
          >
            <Icon
              className={cn(
                'w-6 h-6',
                selected === type ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <span
              className={cn(
                'text-sm font-medium',
                selected === type ? 'text-primary' : 'text-foreground'
              )}
            >
              {label}
            </span>
            <span className="text-xs text-muted-foreground text-center">{speed}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
