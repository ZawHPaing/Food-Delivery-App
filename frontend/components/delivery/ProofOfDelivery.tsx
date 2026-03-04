import { useState } from 'react';
import { ArrowLeft, Camera, PenTool, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProofOfDeliveryProps {
  onCapture: () => void;
  onClose: () => void;
}

export function ProofOfDelivery({ onCapture, onClose }: ProofOfDeliveryProps) {
  const [mode, setMode] = useState<'photo' | 'signature'>('photo');
  const [captured, setCaptured] = useState(false);

  const handleCapture = () => {
    setCaptured(true);
    setTimeout(() => {
      onCapture();
    }, 1500);
  };

  return (
    <div className="rounded-2xl bg-card shadow-card border border-border overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h3 className="font-semibold text-foreground">Proof of Delivery</h3>
      </div>

      {/* Mode selector */}
      <div className="flex p-2 m-4 rounded-xl bg-secondary/50">
        <button
          onClick={() => setMode('photo')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors',
            mode === 'photo' ? 'bg-card shadow' : 'text-muted-foreground'
          )}
        >
          <Camera className="w-4 h-4" />
          <span className="font-medium">Photo</span>
        </button>
      </div>

      {/* Content area */}
      <div className="p-4">
        {captured ? (
          <div className="aspect-[4/3] rounded-xl bg-success/10 border-2 border-success flex flex-col items-center justify-center gap-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center">
              <Check className="w-8 h-8 text-success-foreground" />
            </div>
            <p className="text-success font-semibold">Captured successfully!</p>
          </div>
        ) : mode === 'photo' ? (
          <div className="aspect-[4/3] rounded-xl bg-secondary/50 border-2 border-dashed border-border flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <p className="text-muted-foreground text-center">
              Take a photo of the delivery
              <br />
              <span className="text-sm">e.g., bag at the door</span>
            </p>
            <Button onClick={handleCapture}>
              <Camera className="w-5 h-5" />
              Capture Photo
            </Button>
          </div>
        ) : (
          <div className="aspect-[4/3] rounded-xl bg-secondary/50 border-2 border-dashed border-border flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <PenTool className="w-10 h-10 text-primary" />
            </div>
            <p className="text-muted-foreground text-center">
              Collect digital signature
              <br />
              <span className="text-sm">Have customer sign here</span>
            </p>
            <Button onClick={handleCapture}>
              <PenTool className="w-5 h-5" />
              Start Signature
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
