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
    <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
      <div className={cn('grid gap-3', isSingle ? 'grid-cols-1' : 'grid-cols-2')}>
        {visibleVehicles.map(({ type, icon: Icon, label, speed }) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
              selected === type
                ? 'border-gray-900 bg-gray-50 text-gray-900'
                : 'border-transparent bg-gray-50/50 hover:bg-gray-50 text-gray-600'
            )}
          >
            <Icon className={cn('w-6 h-6', selected === type ? 'text-gray-900' : 'text-gray-500')} />
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-gray-500 text-center">{speed}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
